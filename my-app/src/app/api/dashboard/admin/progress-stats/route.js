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

    const day = searchParams.get('day'); // day1, day2, etc. or 'all'
    const slot = searchParams.get('slot'); // optional
    const facultyMentorId = searchParams.get('facultyMentorId'); // optional
    const studentLeadId = searchParams.get('studentLeadId'); // optional

    // Validate input
    const validDays = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7', 'all'];
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
      conditions.push('sl.facultyMentorId = ?');
      values.push(facultyMentorId);
    }
    if (studentLeadId) {
      conditions.push('r.studentLeadId = ?');
      values.push(studentLeadId);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    // Construct stats query using dynamic column for day
    const statsQuery = day === 'all' ? `
    SELECT
      SUM(CASE WHEN (u.day1 IS NOT NULL OR u.day2 IS NOT NULL OR u.day3 IS NOT NULL OR u.day4 IS NOT NULL OR u.day5 IS NOT NULL OR u.day6 IS NOT NULL OR u.day7 IS NOT NULL) THEN 1 ELSE 0 END) AS uploadsCount,
      SUM(CASE WHEN (v.day1 = TRUE OR v.day2 = TRUE OR v.day3 = TRUE OR v.day4 = TRUE OR v.day5 = TRUE OR v.day6 = TRUE OR v.day7 = TRUE) THEN 1 ELSE 0 END) AS verifiedCount,
      SUM(CASE WHEN (a.day1 = 'A' OR a.day2 = 'A' OR a.day3 = 'A' OR a.day4 = 'A' OR a.day5 = 'A' OR a.day6 = 'A' OR a.day7 = 'A') THEN 1 ELSE 0 END) AS absentCount,
      SUM(CASE WHEN (a.day1 = 'P' OR a.day2 = 'P' OR a.day3 = 'P' OR a.day4 = 'P' OR a.day5 = 'P' OR a.day6 = 'P' OR a.day7 = 'P') THEN 1 ELSE 0 END) AS presentCount
    FROM registrations r
    LEFT JOIN uploads u ON r.username = u.username
    LEFT JOIN verify v ON r.username = v.username
    LEFT JOIN attendance a ON r.username = a.username
    LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
    ${whereClause}
  ` : `
    SELECT
      SUM(CASE WHEN u.${day} IS NOT NULL THEN 1 ELSE 0 END) AS uploadsCount,
      SUM(CASE WHEN v.${day} = TRUE THEN 1 ELSE 0 END) AS verifiedCount,
      SUM(CASE WHEN a.${day} = 'A' THEN 1 ELSE 0 END) AS absentCount,
      SUM(CASE WHEN a.${day} = 'P' THEN 1 ELSE 0 END) AS presentCount
    FROM registrations r
    LEFT JOIN uploads u ON r.username = u.username
    LEFT JOIN verify v ON r.username = v.username
    LEFT JOIN attendance a ON r.username = a.username
    LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
    ${whereClause}
  `;
  

    // Fetch faculty mentors
    const facultyMentorsQuery = `
      SELECT 
        fm.username,
        fm.name,
        fm.phoneNumber,
        fm.email,
        fm.branch,
        fm.lead1Id,
        fm.lead2Id
      FROM facultyMentors fm
      ORDER BY fm.name;
    `;

    // Fetch student leads with faculty mentor filtering
    const studentLeadsQuery = `
      SELECT 
        sl.username,
        sl.name,
        sl.phoneNumber,
        sl.email,
        sl.branch,
        sl.facultyMentorId,
        sl.slot
      FROM studentLeads sl
      WHERE 1=1
      ${facultyMentorId ? 'AND sl.facultyMentorId = ?' : ''}
      ORDER BY sl.name;
    `;

    // Execute all queries
    const [facultyMentors] = await pool.query(facultyMentorsQuery);
    const [studentLeads] = await pool.query(studentLeadsQuery, facultyMentorId ? [facultyMentorId] : []);
    const [stats] = await pool.query(statsQuery, [...values]);

    // Filter student leads based on faculty mentor if needed
    const filteredStudentLeads = facultyMentorId 
        ? studentLeads.filter(lead => lead.facultyMentorId === facultyMentorId)
        : studentLeads;

    return NextResponse.json({ 
        success: true, 
        stats: stats[0],
        facultyMentors,
        studentLeads: filteredStudentLeads
    });

  } catch (err) {
    console.error('Error fetching stats:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
