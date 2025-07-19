import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, error: 'Missing progress id' }, { status: 400 });
  }
  const store = globalThis.__zipProgressStore || {};
  const progress = store[id];
  if (!progress) {
    return NextResponse.json({ success: false, error: 'Progress not found' }, { status: 404 });
  }
  if (!progress.ready || !progress.file) {
    return NextResponse.json({ success: false, error: 'File not ready yet' }, { status: 202 });
  }
  return new NextResponse(progress.file, {
    status: 200,
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="certificates_${new Date().toISOString().split('T')[0]}.zip"`,
    },
  });
} 