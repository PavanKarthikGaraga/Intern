import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(req) {
  try {
    // Verify authentication
    const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ 
                success: false, 
                error: 'Authentication required. Please login again.' 
            }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only admins can view report control status.' 
            }, { status: 403 });
        }

    const { searchParams } = new URL(req.url);

    const day = searchParams.get('day'); // day1, day2, etc.
    const slot = searchParams.get('slot'); // optional
    const facultyMentorId = searchParams.get('facultyMentorId'); // optional
    const studentLeadId = searchParams.get('studentLeadId'); // optional

    // Validate input
    const validDays = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'];
    if (!validDays.includes(day)) {
      return NextResponse.json({ error: 'Invalid day parameter' }, { status: 400 });
    }

    // Build WHERE clause dynamically
    const conditions = [];
    const values = [];

    if (slot) {
      conditions.push('r.slot = ?');
      values.push(slot);
    }
    if (facultyMentorId) {
      conditions.push('r.facultyMentorId = ?');
      values.push(facultyMentorId);
    }
    if (studentLeadId) {
      conditions.push('r.studentLeadId = ?');
      values.push(studentLeadId);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Construct full query using dynamic column for day
    const query = `
      SELECT
        COUNT(CASE WHEN u.${day} IS NOT NULL THEN 1 END) AS uploadsCount,
        COUNT(CASE WHEN v.${day} = TRUE THEN 1 END) AS verifiedCount,
        COUNT(CASE WHEN a.${day} = 'A' THEN 1 END) AS absentCount,
        COUNT(CASE WHEN a.${day} = 'P' THEN 1 END) AS presentCount,
        COUNT(CASE WHEN a.${day} IS NULL AND r.username IS NOT NULL THEN 1 END) AS notPostedAttendance
      FROM registrations r
      LEFT JOIN uploads u ON r.username = u.username
      LEFT JOIN verify v ON r.username = v.username
      LEFT JOIN attendance a ON r.username = a.username
      ${whereClause};
    `;

    const [rows] = await pool.query(query, values);
    console.log(rows[0]);
    return NextResponse.json({ success: true, stats: rows[0] });

  } catch (err) {
    console.error('Error fetching stats:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 