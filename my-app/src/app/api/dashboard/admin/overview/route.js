import { NextResponse } from 'next/server';
import pool  from '@/lib/db';
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

    // Verify that the user is an admin
    const userQuery = 'SELECT role FROM users WHERE username = ?';
    const [userRows] = await pool.query(userQuery, [decoded.username]);

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found in database' 
      }, { status: 404 });
    }

    const userRole = userRows[0].role;

    if (userRole !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: `User role is ${userRole}, but admin role is required` 
      }, { status: 403 });
    }

    // Get total counts
    const [leadsCount] = await pool.query('SELECT COUNT(*) as count FROM studentLeads');
    const [studentsCount] = await pool.query('SELECT COUNT(*) as count FROM registrations');
    const [completedCount] = await pool.query('SELECT COUNT(*) as count FROM registrations WHERE completed = true');
    const [facultyCount] = await pool.query('SELECT COUNT(*) as count FROM facultyMentors');

    // Get verification and attendance stats
    const [verificationStats] = await pool.query(`
      SELECT 
        COUNT(*) as totalVerifiedReports,
        SUM(CASE WHEN v.day1 = TRUE THEN 1 ELSE 0 END +
            CASE WHEN v.day2 = TRUE THEN 1 ELSE 0 END +
            CASE WHEN v.day3 = TRUE THEN 1 ELSE 0 END +
            CASE WHEN v.day4 = TRUE THEN 1 ELSE 0 END +
            CASE WHEN v.day5 = TRUE THEN 1 ELSE 0 END +
            CASE WHEN v.day6 = TRUE THEN 1 ELSE 0 END +
            CASE WHEN v.day7 = TRUE THEN 1 ELSE 0 END) as totalAttendancePosted,
        SUM(CASE WHEN v.day1 = TRUE AND a.day1 IS NULL THEN 1 ELSE 0 END +
            CASE WHEN v.day2 = TRUE AND a.day2 IS NULL THEN 1 ELSE 0 END +
            CASE WHEN v.day3 = TRUE AND a.day3 IS NULL THEN 1 ELSE 0 END +
            CASE WHEN v.day4 = TRUE AND a.day4 IS NULL THEN 1 ELSE 0 END +
            CASE WHEN v.day5 = TRUE AND a.day5 IS NULL THEN 1 ELSE 0 END +
            CASE WHEN v.day6 = TRUE AND a.day6 IS NULL THEN 1 ELSE 0 END +
            CASE WHEN v.day7 = TRUE AND a.day7 IS NULL THEN 1 ELSE 0 END) as pendingAttendance
      FROM verify v
      LEFT JOIN attendance a ON v.username = a.username
    `);

    return NextResponse.json({
      success: true,
      overviewData: {
        leadsCount: leadsCount[0].count,
        studentsCount: studentsCount[0].count,
        completedCount: completedCount[0].count,
        facultyCount: facultyCount[0].count,
        facultyInfo: {
          facultyName: decoded.name || 'Admin'
        }
      },
      statistics: {
        totalVerifiedReports: verificationStats[0].totalVerifiedReports || 0,
        totalAttendancePosted: verificationStats[0].totalAttendancePosted || 0,
        pendingAttendance: verificationStats[0].pendingAttendance || 0
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