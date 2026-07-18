import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('accessToken');
    if (!accessToken?.value)
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });

    const decoded = await verifyAccessToken(accessToken.value);
    if (!decoded || decoded.role !== 'admin')
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });

    const COMPLETED_CONDITION = `
      (
        (r.slot = 1 AND dm.day1 IS NOT NULL AND dm.day2 IS NOT NULL AND dm.day3 IS NOT NULL AND dm.day4 IS NOT NULL AND dm.day5 IS NOT NULL AND dm.day6 IS NOT NULL AND dm.day7 IS NOT NULL AND (COALESCE(dm.day1,0)+COALESCE(dm.day2,0)+COALESCE(dm.day3,0)+COALESCE(dm.day4,0)+COALESCE(dm.day5,0)+COALESCE(dm.day6,0)+COALESCE(dm.day7,0)) >= 60)
        OR
        (r.slot > 1 AND dm.day1 IS NOT NULL AND dm.day2 IS NOT NULL AND dm.day3 IS NOT NULL AND dm.day4 IS NOT NULL AND dm.day5 IS NOT NULL AND dm.day6 IS NOT NULL AND dm.day7 IS NOT NULL AND rb.reportBookMarks IS NOT NULL AND (COALESCE(dm.day1,0)+COALESCE(dm.day2,0)+COALESCE(dm.day3,0)+COALESCE(dm.day4,0)+COALESCE(dm.day5,0)+COALESCE(dm.day6,0)+COALESCE(dm.day7,0)+COALESCE(rb.reportBookMarks,0)) >= 60)
      )
    `;

    // Base filtering condition: Y25 students (starts with '25') in slots 1-6
    const BASE_CONDITION = `r.username LIKE '25%' AND r.slot IN ('1', '2', '3', '4', '5', '6')`;

    // 1. Get total students, completed, and active
    const [overviewRows] = await pool.query(`
      SELECT
        COUNT(DISTINCT r.username) AS totalStudents,
        SUM(CASE WHEN ${COMPLETED_CONDITION} THEN 1 ELSE 0 END) AS totalCompleted,
        SUM(CASE WHEN ${COMPLETED_CONDITION} THEN 0 ELSE 1 END) AS totalActive
      FROM registrations r
      LEFT JOIN dailyMarks dm ON r.username = dm.username
      LEFT JOIN reportBooks rb ON r.username = rb.username
      WHERE ${BASE_CONDITION}
    `);
    const overview = overviewRows[0] || {};
    
    // 2. Get slot-wise counts
    const [slotRows] = await pool.query(`
      SELECT
        r.slot,
        COUNT(DISTINCT r.username) AS total,
        SUM(CASE WHEN ${COMPLETED_CONDITION} THEN 1 ELSE 0 END) AS completed
      FROM registrations r
      LEFT JOIN dailyMarks dm ON r.username = dm.username
      LEFT JOIN reportBooks rb ON r.username = rb.username
      WHERE ${BASE_CONDITION}
      GROUP BY r.slot
      ORDER BY CAST(r.slot AS UNSIGNED)
    `);

    // 3. Get domain-wise counts
    const [domainRows] = await pool.query(`
      SELECT
        r.selectedDomain,
        COUNT(DISTINCT r.username) AS total,
        SUM(CASE WHEN ${COMPLETED_CONDITION} THEN 1 ELSE 0 END) AS completed
      FROM registrations r
      LEFT JOIN dailyMarks dm ON r.username = dm.username
      LEFT JOIN reportBooks rb ON r.username = rb.username
      WHERE ${BASE_CONDITION}
      GROUP BY r.selectedDomain
      ORDER BY total DESC
    `);

    // 4. Get problem statements breakdown
    const [psRows] = await pool.query(`
      SELECT
        ps.problem_statement,
        COUNT(DISTINCT r.username) AS total,
        SUM(CASE WHEN ${COMPLETED_CONDITION} THEN 1 ELSE 0 END) AS completed
      FROM registrations r
      LEFT JOIN problemStatements ps ON r.username = ps.username
      LEFT JOIN dailyMarks dm ON r.username = dm.username
      LEFT JOIN reportBooks rb ON r.username = rb.username
      WHERE ${BASE_CONDITION} AND ps.problem_statement IS NOT NULL AND ps.problem_statement != ''
      GROUP BY ps.problem_statement
      ORDER BY total DESC
    `);

    // 5. Get detailed student data for the CSV download
    const [students] = await pool.query(`
      SELECT
        r.username,
        MAX(r.name) AS name,
        MAX(r.email) AS email,
        MAX(r.phoneNumber) AS phoneNumber,
        MAX(r.branch) AS branch,
        MAX(r.slot) AS slot,
        MAX(r.mode) AS mode,
        MAX(r.selectedDomain) AS selectedDomain,
        MAX(ps.problem_statement) AS problem_statement,
        MAX(CASE WHEN ${COMPLETED_CONDITION} THEN 'Completed' ELSE 'Active' END) AS status,
        MAX(sl.name) AS leadName,
        MAX(fm.name) AS facultyName
      FROM registrations r
      LEFT JOIN problemStatements ps ON r.username = ps.username
      LEFT JOIN dailyMarks dm ON r.username = dm.username
      LEFT JOIN reportBooks rb ON r.username = rb.username
      LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
      LEFT JOIN facultyMentors fm ON r.facultyMentorId = fm.username
      WHERE ${BASE_CONDITION}
      GROUP BY r.username
      ORDER BY MAX(r.slot), MAX(r.selectedDomain), r.username
    `);

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalStudents: Number(overview.totalStudents) || 0,
          totalCompleted: Number(overview.totalCompleted) || 0,
          totalActive: Number(overview.totalActive) || 0,
        },
        slots: slotRows,
        domains: domainRows,
        problemStatements: psRows,
        students: students,
      },
    });

  } catch (error) {
    console.error('Error in Y25 report endpoint:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
