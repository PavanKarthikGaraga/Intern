/**
 * POST /api/uploads — store a student's photo or PDF in RustFS.
 *
 * multipart/form-data fields:
 *   file     (required)  image (JPEG/PNG/WebP/HEIC/GIF) or PDF
 *   day      (optional)  1–7, used to organise the storage key
 *   purpose  (optional)  short label, e.g. "photo", "day2-report", "mygov-certificate"
 *
 * Limits: photos 2 MB (after browser compression), PDFs 10 MB.
 * Images are always re-encoded server-side: auto-rotated from EXIF, resized to fit
 * 1600×1600, saved as JPEG ~80% quality, and stripped of metadata (incl. GPS EXIF).
 * PDFs are stored as-is after a header check.
 *
 * Responds: { success, url, key, size, contentType, width?, height? }
 */
import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { getSession } from '@/lib/auth';
import { parseDay } from '@/lib/validate';
import { putObject, studentKey, isStorageConfigured } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Limits agreed for student uploads. Photos are compressed in the browser first, so
// a photo only hits this limit if it still can't be brought under 2 MB.
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;   // 2 MB per photo
const MAX_PDF_BYTES = 10 * 1024 * 1024;    // 10 MB per PDF
const MAX_REQUEST_BYTES = MAX_PDF_BYTES + 512 * 1024; // + multipart overhead
const MAX_DIMENSION = 1600;

/** Identify a file by its leading bytes rather than trusting the client's MIME type. */
function sniffType(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.toString('ascii', 0, 4) === 'GIF8') return 'image/gif';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return 'image/webp';
  if (buf.toString('ascii', 4, 8) === 'ftyp') {
    const brand = buf.toString('ascii', 8, 12);
    if (['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'mif1', 'msf1', 'avif'].includes(brand)) return 'image/heic';
  }
  if (buf.toString('ascii', 0, 5) === '%PDF-') return 'application/pdf';
  return null;
}

function json(status, body) {
  return NextResponse.json(body, { status });
}

export async function POST(request) {
  const user = await getSession();
  if (!user) return json(401, { success: false, error: 'Your session has expired. Please log in again.' });
  if (user.role !== 'student') return json(403, { success: false, error: 'Only students can upload files.' });

  if (!isStorageConfigured()) {
    console.error('[uploads] S3_* environment variables are not set');
    return json(503, { success: false, error: 'File uploads are temporarily unavailable. Please try again later or contact the SAC office.' });
  }

  const declaredLength = Number(request.headers.get('content-length') || 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return json(413, { success: false, error: 'This file is too large. Photos must be under 2 MB and PDFs under 10 MB.' });
  }

  let form;
  try {
    form = await request.formData();
  } catch {
    return json(400, { success: false, error: 'Invalid upload request.' });
  }

  const file = form.get('file');
  if (!file || typeof file === 'string' || typeof file.arrayBuffer !== 'function') {
    return json(400, { success: false, error: 'No file was received.' });
  }

  const day = parseDay(form.get('day'));
  const purpose = String(form.get('purpose') || 'file');
  const input = Buffer.from(await file.arrayBuffer());
  if (input.length === 0) return json(400, { success: false, error: 'The selected file is empty.' });

  const type = sniffType(input);
  if (!type) {
    return json(415, { success: false, error: 'Unsupported file type. Please upload a JPG, PNG or WebP photo, or a PDF.' });
  }

  try {
    if (type === 'application/pdf') {
      if (input.length > MAX_PDF_BYTES) {
        return json(413, { success: false, error: `This PDF is ${(input.length / 1048576).toFixed(1)} MB. The maximum is 10 MB — please reduce its size and try again.` });
      }
      const key = studentKey(user.username, { day, purpose, ext: 'pdf' });
      const stored = await putObject(key, input, 'application/pdf', { originalname: safeName(file.name) });
      return json(200, { success: true, ...stored, size: input.length, contentType: 'application/pdf' });
    }

    // ── Image: normalise + compress ──
    if (input.length > MAX_IMAGE_BYTES) {
      return json(413, { success: false, error: `This photo is ${(input.length / 1048576).toFixed(1)} MB and could not be compressed below the 2 MB limit. Please choose a smaller photo or take a screenshot of it.` });
    }

    let output;
    try {
      output = await sharp(input, { failOn: 'none', limitInputPixels: 120_000_000 })
        .rotate() // apply EXIF orientation; metadata (incl. GPS) is dropped on re-encode
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: 'inside', withoutEnlargement: true })
        .flatten({ background: '#ffffff' }) // JPEG has no alpha (transparent PNGs → white)
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });
    } catch (err) {
      console.warn('[uploads] image decode failed:', type, err?.message);
      const iphoneHint = type === 'image/heic'
        ? ' iPhone photos: go to Settings → Camera → Formats → "Most Compatible", or take a screenshot of the photo and upload that.'
        : '';
      return json(415, { success: false, error: `We couldn't read this photo.${iphoneHint}` });
    }

    const key = studentKey(user.username, { day, purpose, ext: 'jpg' });
    const stored = await putObject(key, output.data, 'image/jpeg', { originalname: safeName(file.name) });
    return json(200, {
      success: true,
      ...stored,
      size: output.data.length,
      contentType: 'image/jpeg',
      width: output.info.width,
      height: output.info.height,
    });
  } catch (err) {
    console.error('[uploads] storage error:', err);
    return json(502, { success: false, error: 'Could not save the file right now. Please try again in a moment.' });
  }
}

/** S3 metadata values must be ASCII; keep a readable, safe version of the original name. */
function safeName(name) {
  return String(name || 'upload').replace(/[^\x20-\x7e]/g, '_').slice(0, 120);
}
