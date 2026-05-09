import { NextResponse } from 'next/server';
import { defaultPool as pool } from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/activityLog';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('accessToken');

    if (!accessToken?.value) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyAccessToken(accessToken.value);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const [rows] = await pool.query('SELECT * FROM video_dump ORDER BY sort_order ASC, created_at DESC');
    return NextResponse.json({ success: true, videos: rows });
  } catch (error) {
    console.error('Error fetching videos:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('accessToken');

    if (!accessToken?.value) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyAccessToken(accessToken.value);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    const { videos } = await req.json();

    if (!Array.isArray(videos)) {
      return NextResponse.json({ success: false, error: 'Invalid data format' }, { status: 400 });
    }

    // This endpoint handles both adding/updating and reordering
    // For simplicity, we'll clear and re-insert or use a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Delete existing videos and re-insert or update
      // But reordering is the main goal here.
      // If we want to support partial updates, it's more complex.
      // Let's assume we send the full list to sync order.
      
      await connection.query('DELETE FROM video_dump');
      
      if (videos.length > 0) {
        const values = videos.map((v, index) => [
          v.url,
          v.type || (v.url.includes('youtube.com') || v.url.includes('youtu.be') ? 'youtube' : 'instagram'),
          v.title || '',
          v.description || '',
          index
        ]);
        
        await connection.query(
          'INSERT INTO video_dump (url, type, title, description, sort_order) VALUES ?',
          [values]
        );
      }

      await connection.commit();
      
      logActivity({
        action: 'UPDATE_VIDEO_DUMP',
        actorUsername: decoded.username,
        actorName: decoded.name,
        actorRole: 'admin',
        details: { count: videos.length }
      }).catch(() => {});

      return NextResponse.json({ success: true, message: 'Videos updated successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating videos:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
