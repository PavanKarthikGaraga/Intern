import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(req) {
  try {
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
        error: 'Access denied. Only admin members can access this data.' 
      }, { status: 403 });
    }

    // Get slot from query params
    const { searchParams } = new URL(req.url);
    const slot = searchParams.get('slot');
    const slotFilter = slot && slot !== 'all' ? 'WHERE r.slot = ?' : '';
    const slotFilterAnd = slot && slot !== 'all' ? 'AND r.slot = ?' : '';
    const slotParams = slot && slot !== 'all' ? [parseInt(slot)] : [];

    // Get basic counts with slot filter
    const [leadsCount] = await pool.query('SELECT COUNT(*) as count FROM studentLeads');

    const [facultyCount] = await pool.query('SELECT COUNT(*) as count FROM facultyMentors');
    
    const [studentsCount] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM registrations r 
      ${slotFilter}
    `, slotParams);
    // Helper logic for 'completed' criteria based on slot
    const COMPLETED_CONDITION = `
      (
        (r.slot = 1 AND dm.day1 IS NOT NULL AND dm.day2 IS NOT NULL AND dm.day3 IS NOT NULL AND dm.day4 IS NOT NULL AND dm.day5 IS NOT NULL AND dm.day6 IS NOT NULL AND dm.day7 IS NOT NULL AND (COALESCE(dm.day1,0)+COALESCE(dm.day2,0)+COALESCE(dm.day3,0)+COALESCE(dm.day4,0)+COALESCE(dm.day5,0)+COALESCE(dm.day6,0)+COALESCE(dm.day7,0)) >= 60)
        OR
        (r.slot > 1 AND dm.day1 IS NOT NULL AND dm.day2 IS NOT NULL AND dm.day3 IS NOT NULL AND dm.day4 IS NOT NULL AND dm.day5 IS NOT NULL AND dm.day6 IS NOT NULL AND dm.day7 IS NOT NULL AND rb.reportBookMarks IS NOT NULL AND (COALESCE(dm.day1,0)+COALESCE(dm.day2,0)+COALESCE(dm.day3,0)+COALESCE(dm.day4,0)+COALESCE(dm.day5,0)+COALESCE(dm.day6,0)+COALESCE(dm.day7,0)+COALESCE(rb.reportBookMarks,0)) >= 60)
      )
    `;

    const [completedCount] = await pool.query(`
      SELECT COUNT(*) as total 
      FROM registrations r 
      LEFT JOIN dailyMarks dm ON r.username = dm.username
      LEFT JOIN reportBooks rb ON r.username = rb.username
      WHERE ${COMPLETED_CONDITION} ${slotFilterAnd}
    `, slotParams);

    
    const MARKS_SUBQUERY = `
      (
        SELECT 
          r.username,
          r.slot,
          CASE 
            WHEN r.slot = 1 THEN (COALESCE(dm.day1, 0) + COALESCE(dm.day2, 0) + COALESCE(dm.day3, 0) + COALESCE(dm.day4, 0) + COALESCE(dm.day5, 0) + COALESCE(dm.day6, 0) + COALESCE(dm.day7, 0))
            ELSE (COALESCE(dm.day1, 0) + COALESCE(dm.day2, 0) + COALESCE(dm.day3, 0) + COALESCE(dm.day4, 0) + COALESCE(dm.day5, 0) + COALESCE(dm.day6, 0) + COALESCE(dm.day7, 0) + COALESCE(rb.reportBookMarks, 0))
          END AS totalMarks,
          (dm.day1 IS NOT NULL OR dm.day2 IS NOT NULL OR dm.day3 IS NOT NULL OR dm.day4 IS NOT NULL OR dm.day5 IS NOT NULL OR dm.day6 IS NOT NULL OR dm.day7 IS NOT NULL OR rb.reportBookMarks IS NOT NULL) AS participated
        FROM registrations r
        LEFT JOIN dailyMarks dm ON r.username = dm.username
        LEFT JOIN reportBooks rb ON r.username = rb.username
      ) m
    `;

    // Get new statistics with slot filter
    const [totalPassed] = await pool.query(`
      SELECT COUNT(*) AS total_passed
      FROM ${MARKS_SUBQUERY} WHERE m.totalMarks >= 60 AND m.participated = 1 ${slotFilterAnd.replace('r.slot', 'm.slot')}
    `, slotParams);

    const [totalFailed] = await pool.query(`
      SELECT COUNT(*) AS total_failed
      FROM ${MARKS_SUBQUERY} WHERE m.totalMarks < 60 AND m.participated = 1 ${slotFilterAnd.replace('r.slot', 'm.slot')}
    `, slotParams);

    const [totalParticipated] = await pool.query(`
      SELECT COUNT(*) AS total_participated
      FROM ${MARKS_SUBQUERY} WHERE m.participated = 1 ${slotFilterAnd.replace('r.slot', 'm.slot')}
    `, slotParams);

    // Get marks distribution with slot filter
    const [marksDistribution] = await pool.query(`
      SELECT 
        SUM(CASE WHEN m.totalMarks >= 95 THEN 1 ELSE 0 END) AS '95_to_100',
        SUM(CASE WHEN m.totalMarks >= 90 AND m.totalMarks < 95 THEN 1 ELSE 0 END) AS '90_to_95',
        SUM(CASE WHEN m.totalMarks >= 80 AND m.totalMarks < 90 THEN 1 ELSE 0 END) AS '80_to_89',
        SUM(CASE WHEN m.totalMarks >= 70 AND m.totalMarks < 80 THEN 1 ELSE 0 END) AS '70_to_79',
        SUM(CASE WHEN m.totalMarks >= 60 AND m.totalMarks < 70 THEN 1 ELSE 0 END) AS '60_to_69',
        SUM(CASE WHEN m.totalMarks < 60 THEN 1 ELSE 0 END) AS 'below_60'
      FROM ${MARKS_SUBQUERY} WHERE m.participated = 1 ${slotFilter.replace('WHERE ', 'AND ').replace('r.slot', 'm.slot')}
    `, slotParams);

    // Get verification and attendance stats
    const [verificationStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN day1 = true THEN 1 ELSE 0 END) as day1,
        SUM(CASE WHEN day2 = true THEN 1 ELSE 0 END) as day2,
        SUM(CASE WHEN day3 = true THEN 1 ELSE 0 END) as day3,
        SUM(CASE WHEN day4 = true THEN 1 ELSE 0 END) as day4,
        SUM(CASE WHEN day5 = true THEN 1 ELSE 0 END) as day5,
        SUM(CASE WHEN day6 = true THEN 1 ELSE 0 END) as day6,
        SUM(CASE WHEN day7 = true THEN 1 ELSE 0 END) as day7
      FROM verify
    `);

    const [attendanceStats] = await pool.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN day1 = 'P' THEN 1 ELSE 0 END) as day1,
        SUM(CASE WHEN day2 = 'P' THEN 1 ELSE 0 END) as day2,
        SUM(CASE WHEN day3 = 'P' THEN 1 ELSE 0 END) as day3,
        SUM(CASE WHEN day4 = 'P' THEN 1 ELSE 0 END) as day4,
        SUM(CASE WHEN day5 = 'P' THEN 1 ELSE 0 END) as day5,
        SUM(CASE WHEN day6 = 'P' THEN 1 ELSE 0 END) as day6,
        SUM(CASE WHEN day7 = 'P' THEN 1 ELSE 0 END) as day7
      FROM attendance
    `);

    // Get domain distribution
    const [domainStats] = await pool.query(`
      SELECT 
        r.selectedDomain,
        COUNT(*) as count,
        SUM(CASE WHEN ${COMPLETED_CONDITION} THEN 1 ELSE 0 END) as completed,
        MAX(r.updatedAt) as updatedAt
      FROM registrations r
      LEFT JOIN dailyMarks dm ON r.username = dm.username
      LEFT JOIN reportBooks rb ON r.username = rb.username
      GROUP BY r.selectedDomain
      ORDER BY updatedAt DESC
    `);

    // Get mode distribution
    const [modeStats] = await pool.query(`
      SELECT 
        r.mode,
        COUNT(*) as count,
        SUM(CASE WHEN ${COMPLETED_CONDITION} THEN 1 ELSE 0 END) as completed,
        MAX(r.updatedAt) as updatedAt
      FROM registrations r
      LEFT JOIN dailyMarks dm ON r.username = dm.username
      LEFT JOIN reportBooks rb ON r.username = rb.username
      GROUP BY r.mode
      ORDER BY updatedAt DESC
    `);

    // Get slot distribution
    const [slotStats] = await pool.query(`
      SELECT 
        r.slot,
        COUNT(*) as count,
        SUM(CASE WHEN ${COMPLETED_CONDITION} THEN 1 ELSE 0 END) as completed,
        MAX(r.updatedAt) as updatedAt
      FROM registrations r
      LEFT JOIN dailyMarks dm ON r.username = dm.username
      LEFT JOIN reportBooks rb ON r.username = rb.username
      GROUP BY r.slot
      ORDER BY r.slot
    `);

    // Get state-wise distribution (now with slot and mode)
    const [stateStats] = await pool.query(`
      SELECT 
        state,
        slot,
        mode,
        COUNT(*) as count,
        SUM(CASE WHEN gender = 'Male' THEN 1 ELSE 0 END) as male,
        SUM(CASE WHEN gender = 'Female' THEN 1 ELSE 0 END) as female,
        SUM(CASE WHEN gender = 'Other' THEN 1 ELSE 0 END) as other,
        MAX(updatedAt) as updatedAt
      FROM registrations
      GROUP BY state, slot, mode
      ORDER BY updatedAt DESC
    `);

    // Get district-wise distribution (now with slot and mode)
    const [districtStats] = await pool.query(`
      SELECT 
        state,
        district,
        slot,
        mode,
        COUNT(*) as count,
        SUM(CASE WHEN gender = 'Male' THEN 1 ELSE 0 END) as male,
        SUM(CASE WHEN gender = 'Female' THEN 1 ELSE 0 END) as female,
        SUM(CASE WHEN gender = 'Other' THEN 1 ELSE 0 END) as other,
        MAX(updatedAt) as updatedAt
      FROM registrations
      GROUP BY state, district, slot, mode
      ORDER BY updatedAt DESC
    `);

    // Get accommodation and transport stats for In-Campus students slot-wise
    const [residenceStats] = await pool.query(`
      SELECT 
        slot,
        SUM(CASE WHEN LOWER(accommodation) = 'yes' THEN 1 ELSE 0 END) as accommodationCount,
        SUM(CASE WHEN LOWER(transportation) = 'yes' THEN 1 ELSE 0 END) as transportationCount
      FROM registrations
      WHERE mode = 'InCampus'
      GROUP BY slot
      ORDER BY slot
    `);

    return NextResponse.json({
      success: true,
      overviewData: {
        leadsCount: leadsCount[0].count,
        studentsCount: studentsCount[0].count,
        completedCount: completedCount[0].total,
        facultyCount: facultyCount[0].count,
        totalPassed: totalPassed[0].total_passed,
        totalFailed: totalFailed[0].total_failed,
        totalParticipated: totalParticipated[0].total_participated,
        marksDistribution: marksDistribution[0],
        verificationStats: verificationStats[0],
        attendanceStats: attendanceStats[0],
        domainStats,
        modeStats,
        slotStats,
        stateStats,
        districtStats,
        residenceStats
      }
    });
  } catch (error) {
    console.error('Error in admin overview API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 