/**
 * POST /api/uploads/merge — combine a student's already-uploaded files
 * (certificate photos and/or PDFs) into a single PDF stored in RustFS.
 *
 * JSON body: { urls: string[], day?: 1–7, purpose?: string, title?: string }
 * Only files inside the caller's own storage prefix can be merged.
 *
 * Responds: { success, url, key, size, pages }
 */
import { NextResponse } from 'next/server';
import { PDFDocument } from 'pdf-lib';
import { getSession } from '@/lib/auth';
import { parseDay } from '@/lib/validate';
import {
  getObjectBuffer, putObject, studentKey, studentPrefix, keyFromFileUrl, isStorageConfigured,
} from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const MAX_FILES = 20;
const MAX_BUNDLE_BYTES = 10 * 1024 * 1024; // combined PDF follows the same 10 MB PDF limit
const A4 = { w: 595.28, h: 841.89 }; // points
const PAGE_MARGIN = 24;

export async function POST(request) {
  const user = await getSession();
  if (!user) return NextResponse.json({ success: false, error: 'Your session has expired. Please log in again.' }, { status: 401 });
  if (user.role !== 'student') return NextResponse.json({ success: false, error: 'Only students can merge files.' }, { status: 403 });
  if (!isStorageConfigured()) {
    return NextResponse.json({ success: false, error: 'File uploads are temporarily unavailable.' }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }

  const urls = Array.isArray(body?.urls) ? body.urls.filter((u) => typeof u === 'string') : [];
  if (urls.length === 0) return NextResponse.json({ success: false, error: 'No files to combine.' }, { status: 400 });
  if (urls.length > MAX_FILES) {
    return NextResponse.json({ success: false, error: `You can combine at most ${MAX_FILES} files.` }, { status: 400 });
  }

  const prefix = studentPrefix(user.username);
  const keys = urls.map(keyFromFileUrl);
  if (keys.some((k) => !k || !k.startsWith(prefix) || k.includes('..'))) {
    return NextResponse.json({ success: false, error: 'One or more files could not be found.' }, { status: 403 });
  }

  try {
    const out = await PDFDocument.create();
    out.setTitle(String(body.title || 'MyGov Certificates').slice(0, 120));
    out.setProducer('KL University Social Internship');

    for (const key of keys) {
      const obj = await getObjectBuffer(key);
      if (!obj) {
        return NextResponse.json({ success: false, error: 'One of the uploaded files is missing. Please remove it and upload it again.' }, { status: 404 });
      }

      if (obj.contentType === 'application/pdf') {
        const src = await PDFDocument.load(obj.buffer, { ignoreEncryption: true });
        const pages = await out.copyPages(src, src.getPageIndices());
        pages.forEach((p) => out.addPage(p));
      } else {
        // Uploaded images are normalised to JPEG by /api/uploads
        const img = obj.contentType === 'image/png' ? await out.embedPng(obj.buffer) : await out.embedJpg(obj.buffer);
        const landscape = img.width > img.height;
        const pageW = landscape ? A4.h : A4.w;
        const pageH = landscape ? A4.w : A4.h;
        const scale = Math.min((pageW - PAGE_MARGIN * 2) / img.width, (pageH - PAGE_MARGIN * 2) / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        const page = out.addPage([pageW, pageH]);
        page.drawImage(img, { x: (pageW - w) / 2, y: (pageH - h) / 2, width: w, height: h });
      }
    }

    const bytes = Buffer.from(await out.save());
    if (bytes.length > MAX_BUNDLE_BYTES) {
      return NextResponse.json({ success: false, error: `Your certificates add up to ${(bytes.length / 1048576).toFixed(1)} MB; the combined PDF must be under 10 MB. Please remove or replace the largest files.` }, { status: 413 });
    }
    const key = studentKey(user.username, {
      day: parseDay(body.day),
      purpose: String(body.purpose || 'combined'),
      ext: 'pdf',
    });
    const stored = await putObject(key, bytes, 'application/pdf');
    return NextResponse.json({ success: true, ...stored, size: bytes.length, pages: out.getPageCount() });
  } catch (err) {
    console.error('[uploads/merge] failed:', err);
    return NextResponse.json({ success: false, error: 'Could not combine the files. If a PDF is password-protected, upload a screenshot of it instead.' }, { status: 500 });
  }
}
