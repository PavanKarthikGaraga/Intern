import { NextResponse } from 'next/server';
import { defaultPool as pool } from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('accessToken');

    if (!accessToken?.value) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyAccessToken(accessToken.value);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const [rows] = await pool.query('SELECT url, type, title, description FROM video_dump ORDER BY sort_order ASC, created_at DESC');
    return NextResponse.json({ success: true, videos: rows });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
