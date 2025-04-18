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

    // Get basic counts
    const [leadsCount] = await pool.query('SELECT COUNT(*) as count FROM studentLeads');
    const [studentsCount] = await pool.query('SELECT COUNT(*) as count FROM registrations');
    const [completedCount] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM final 
      WHERE completed = true
    `);
    const [facultyCount] = await pool.query('SELECT COUNT(*) as count FROM facultyMentors');

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
        SUM(CASE WHEN f.completed = true THEN 1 ELSE 0 END) as completed
      FROM registrations r
      LEFT JOIN final f ON r.username = f.username
      GROUP BY r.selectedDomain
      ORDER BY count DESC
    `);

    // Get mode distribution
    const [modeStats] = await pool.query(`
      SELECT 
        r.mode,
        COUNT(*) as count,
        SUM(CASE WHEN f.completed = true THEN 1 ELSE 0 END) as completed
      FROM registrations r
      LEFT JOIN final f ON r.username = f.username
      GROUP BY r.mode
    `);

    // Get slot distribution
    const [slotStats] = await pool.query(`
      SELECT 
        r.slot,
        COUNT(*) as count,
        SUM(CASE WHEN f.completed = true THEN 1 ELSE 0 END) as completed
      FROM registrations r
      LEFT JOIN final f ON r.username = f.username
      GROUP BY r.slot
      ORDER BY r.slot
    `);

    return NextResponse.json({
      success: true,
      data: {
        counts: {
          leads: leadsCount[0].count,
          students: studentsCount[0].count,
          completed: completedCount[0].count,
          faculty: facultyCount[0].count
        },
        verification: verificationStats[0],
        attendance: attendanceStats[0],
        distributions: {
          domains: domainStats,
          modes: modeStats,
          slots: slotStats
        }
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