/**
 * GET /api/files/<storage key> — stream a stored file from RustFS.
 *
 * Access:
 *   student                           → only their own files (students/<username>/…)
 *   admin, facultyMentor, studentLead → any student file (needed for evaluation)
 *
 * Add ?download=1 to force a download instead of opening inline.
 */
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getObject, isStorageConfigured, studentPrefix } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const STAFF_ROLES = new Set(['admin', 'facultyMentor', 'studentLead']);

export async function GET(request, { params }) {
  const user = await getSession();
  if (!user) {
    return NextResponse.json({ success: false, error: 'Please log in to view this file.' }, { status: 401 });
  }

  const { key: parts } = await params;
  const key = (parts || []).join('/');

  // Reject anything outside the student namespace or with path tricks
  if (!key.startsWith('students/') || key.includes('..') || key.includes('//')) {
    return NextResponse.json({ success: false, error: 'File not found.' }, { status: 404 });
  }

  const allowed = STAFF_ROLES.has(user.role) || key.startsWith(studentPrefix(user.username));
  if (!allowed) {
    return NextResponse.json({ success: false, error: 'You do not have access to this file.' }, { status: 403 });
  }

  if (!isStorageConfigured()) {
    return NextResponse.json({ success: false, error: 'File storage is not configured.' }, { status: 503 });
  }

  let obj;
  try {
    obj = await getObject(key);
  } catch (err) {
    console.error('[files] storage error:', err);
    return NextResponse.json({ success: false, error: 'Could not load the file right now.' }, { status: 502 });
  }
  if (!obj) {
    return NextResponse.json({ success: false, error: 'File not found.' }, { status: 404 });
  }

  const filename = key.split('/').pop();
  const download = new URL(request.url).searchParams.get('download') === '1';

  const headers = {
    'Content-Type': obj.contentType,
    'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${filename}"`,
    // Keys are unique per upload, so the content never changes
    'Cache-Control': 'private, max-age=86400, immutable',
    'X-Content-Type-Options': 'nosniff',
  };
  if (obj.contentLength) headers['Content-Length'] = String(obj.contentLength);

  return new Response(obj.body.transformToWebStream(), { status: 200, headers });
}
