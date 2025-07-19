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
  // Don't send the file buffer
  const { file, ...rest } = progress;
  return NextResponse.json({ success: true, progress: rest });
} 