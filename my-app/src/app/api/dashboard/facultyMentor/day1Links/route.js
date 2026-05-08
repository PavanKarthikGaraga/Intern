import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

/**
 * GET /api/dashboard/facultyMentor/day1Links?username=XXX
 * Returns LinkedIn & YouTube URLs submitted by the student in Day 1.
 * Accessible by facultyMentor, studentLead, and admin roles.
 */
export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await verifyAccessToken(token);
    if (!['facultyMentor', 'studentLead', 'admin'].includes(decoded?.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 });

    const [rows] = await pool.query(
      `SELECT data FROM dailyTasks WHERE username = ? AND day = 1 LIMIT 1`,
      [username]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, linkedinUrl: null, youtubeUrl: null });
    }

    const d1 = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data;

    return NextResponse.json({
      success: true,
      linkedinUrl: d1.linkedinUrl || null,
      youtubeUrl:  d1.youtubeUrl  || null,
    });
  } catch (error) {
    console.error('Error fetching day1 links:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
