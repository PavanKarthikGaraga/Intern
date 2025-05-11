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
      conditions.push('r.facultyMentorId = ?');
      values.push(facultyMentorId);
    }
    if (studentLeadId) {
      conditions.push('r.studentLeadId = ?');
      values.push(studentLeadId);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

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

    // Construct stats query using dynamic column for day
    const statsQuery = day === 'all' ? `
      SELECT
        SUM(CASE WHEN u.day1 IS NOT NULL OR u.day2 IS NOT NULL OR u.day3 IS NOT NULL OR 
                  u.day4 IS NOT NULL OR u.day5 IS NOT NULL OR u.day6 IS NOT NULL OR 
                  u.day7 IS NOT NULL THEN 1 ELSE 0 END) AS uploadsCount,
        SUM(CASE WHEN v.day1 = TRUE OR v.day2 = TRUE OR v.day3 = TRUE OR 
                  v.day4 = TRUE OR v.day5 = TRUE OR v.day6 = TRUE OR 
                  v.day7 = TRUE THEN 1 ELSE 0 END) AS verifiedCount,
        SUM(CASE WHEN a.day1 = 'A' OR a.day2 = 'A' OR a.day3 = 'A' OR 
                  a.day4 = 'A' OR a.day5 = 'A' OR a.day6 = 'A' OR 
                  a.day7 = 'A' THEN 1 ELSE 0 END) AS absentCount,
        SUM(CASE WHEN a.day1 = 'P' OR a.day2 = 'P' OR a.day3 = 'P' OR 
                  a.day4 = 'P' OR a.day5 = 'P' OR a.day6 = 'P' OR 
                  a.day7 = 'P' THEN 1 ELSE 0 END) AS presentCount,
        COUNT(CASE WHEN a.day1 IS NULL AND a.day2 IS NULL AND a.day3 IS NULL AND 
                    a.day4 IS NULL AND a.day5 IS NULL AND a.day6 IS NULL AND 
                    a.day7 IS NULL AND r.username IS NOT NULL THEN 1 END) AS notPostedAttendance,
        (
          SELECT COUNT(DISTINCT r2.username)
          FROM registrations r2
          LEFT JOIN verify v2 ON r2.username = v2.username
          WHERE r2.facultyMentorId = r.facultyMentorId
          AND (v2.day1 = TRUE OR v2.day2 = TRUE OR v2.day3 = TRUE OR 
               v2.day4 = TRUE OR v2.day5 = TRUE OR v2.day6 = TRUE OR 
               v2.day7 = TRUE)
          ${whereClause}
        ) as verifiedByFacultyMentor,
        (
          SELECT COUNT(DISTINCT r3.username)
          FROM registrations r3
          LEFT JOIN attendance a3 ON r3.username = a3.username
          WHERE r3.studentLeadId = r.studentLeadId
          AND (a3.day1 = 'P' OR a3.day2 = 'P' OR a3.day3 = 'P' OR 
               a3.day4 = 'P' OR a3.day5 = 'P' OR a3.day6 = 'P' OR 
               a3.day7 = 'P')
          ${whereClause}
        ) as attendanceByStudentLead
      FROM registrations r
      LEFT JOIN uploads u ON r.username = u.username
      LEFT JOIN verify v ON r.username = v.username
      LEFT JOIN attendance a ON r.username = a.username
      ${whereClause};
    ` : `
      SELECT
        COUNT(CASE WHEN u.${day} IS NOT NULL THEN 1 END) AS uploadsCount,
        COUNT(CASE WHEN v.${day} = TRUE THEN 1 END) AS verifiedCount,
        COUNT(CASE WHEN a.${day} = 'A' THEN 1 END) AS absentCount,
        COUNT(CASE WHEN a.${day} = 'P' THEN 1 END) AS presentCount,
        COUNT(CASE WHEN a.${day} IS NULL AND r.username IS NOT NULL THEN 1 END) AS notPostedAttendance,
        (
          SELECT COUNT(DISTINCT r2.username)
          FROM registrations r2
          LEFT JOIN verify v2 ON r2.username = v2.username
          WHERE r2.facultyMentorId = r.facultyMentorId
          AND v2.${day} = TRUE
          ${whereClause}
        ) as verifiedByFacultyMentor,
        (
          SELECT COUNT(DISTINCT r3.username)
          FROM registrations r3
          LEFT JOIN attendance a3 ON r3.username = a3.username
          WHERE r3.studentLeadId = r.studentLeadId
          AND a3.${day} = 'P'
          ${whereClause}
        ) as attendanceByStudentLead
      FROM registrations r
      LEFT JOIN uploads u ON r.username = u.username
      LEFT JOIN verify v ON r.username = v.username
      LEFT JOIN attendance a ON r.username = a.username
      ${whereClause};
    `;

    // Execute all queries
    const [facultyMentors] = await pool.query(facultyMentorsQuery);
    const [studentLeads] = await pool.query(studentLeadsQuery, facultyMentorId ? [facultyMentorId] : []);
    const [stats] = await pool.query(statsQuery, values);

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