import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request) {
  const connection = await pool.getConnection();
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get('accessToken');

    if (!accessToken?.value) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required. Please login again.' 
      }, { status: 401 });
    }

    const decoded = await verifyAccessToken(accessToken.value);
    if (!decoded || decoded.role !== 'facultyMentor') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only faculty mentors can access this resource.' 
      }, { status: 403 });
    }

    // Get faculty mentor info
    const [facultyInfo] = await connection.query(
      `SELECT f.*, u.name 
       FROM facultyMentors f 
       JOIN users u ON f.username = u.username 
       WHERE f.username = ?`,
      [decoded.username]
    );

    // Get assigned leads count
    const [leadsCount] = await connection.query(
      `SELECT COUNT(*) as count 
       FROM studentLeads 
       WHERE facultyMentorId = ?`,
      [decoded.username]
    );

    // Get total students count
    const [studentsCount] = await connection.query(
      `SELECT COUNT(*) as count 
       FROM registrations 
       WHERE facultyMentorId = ?`,
      [decoded.username]
    );

    // Get completed students count
    const [completedCount] = await connection.query(
      `SELECT COUNT(*) as count 
       FROM final 
       WHERE facultyMentorId = ? AND completed = true`,
      [decoded.username]
    );

    // Get total verified reports count
    const [totalVerified] = await connection.query(
      `SELECT COUNT(*) as count
       FROM verify v
       JOIN registrations r ON v.username = r.username
       WHERE r.facultyMentorId = ?
       AND (v.day1 = true OR v.day2 = true OR v.day3 = true OR 
            v.day4 = true OR v.day5 = true OR v.day6 = true OR v.day7 = true)`,
      [decoded.username]
    );

    // Get total attendance posted count
    const [totalAttendance] = await connection.query(
      `SELECT COUNT(*) as count
       FROM attendance a
       JOIN registrations r ON a.username = r.username
       WHERE r.facultyMentorId = ?
       AND (a.day1 IS NOT NULL OR a.day2 IS NOT NULL OR a.day3 IS NOT NULL OR 
            a.day4 IS NOT NULL OR a.day5 IS NOT NULL OR a.day6 IS NOT NULL OR a.day7 IS NOT NULL)`,
      [decoded.username]
    );

    // Calculate total possible attendance (students * 7 days)
    const totalPossibleAttendance = studentsCount[0].count * 7;
    const pendingAttendance = totalPossibleAttendance - totalAttendance[0].count;

    return NextResponse.json({
      success: true,
      data: {
        facultyInfo: facultyInfo[0],
        leadsCount: leadsCount[0].count,
        studentsCount: studentsCount[0].count,
        completedCount: completedCount[0].count,
        totalVerifiedReports: totalVerified[0].count,
        totalAttendancePosted: totalAttendance[0].count,
        pendingAttendance: pendingAttendance
      }
    });

  } catch (error) {
    console.error('Error in overview GET:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 