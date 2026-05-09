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
    
    // Fetch all announcements and join with announcement_reads for this specific student
    const query = `
      SELECT a.*, 
             CASE WHEN ar.id IS NOT NULL THEN 1 ELSE 0 END as isRead
      FROM announcements a
      LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.student_username = ?
      ORDER BY a.created_at DESC
    `;
    
    const [rows] = await pool.query(query, [decoded.username]);
    return NextResponse.json({ success: true, announcements: rows });
  } catch (error) {
    console.error('Error fetching student announcements:', error);
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
    const { announcementId } = await req.json();

    if (!announcementId) {
      return NextResponse.json({ success: false, error: 'Announcement ID is required' }, { status: 400 });
    }

    // Insert into announcement_reads if not already present
    await pool.query(
      'INSERT IGNORE INTO announcement_reads (announcement_id, student_username) VALUES (?, ?)',
      [announcementId, decoded.username]
    );

    return NextResponse.json({ success: true, message: 'Marked as read' });
  } catch (error) {
    console.error('Error marking announcement as read:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
