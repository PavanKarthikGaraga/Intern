import { NextResponse } from 'next/server';
import { pool } from '@/config/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('accessToken');

    if (!accessToken?.value) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access token is missing. Please login again.' 
      }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await verifyAccessToken(accessToken.value);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token. Please login again.' 
      }, { status: 401 });
    }

    if (!decoded) {
      return NextResponse.json({ 
        success: false, 
        error: 'Token verification failed. Please login again.' 
      }, { status: 401 });
    }

    const { username } = await req.json();

    // Verify that the user is a faculty mentor
    const userQuery = 'SELECT role FROM users WHERE username = ?';
    const [userRows] = await pool.query(userQuery, [username]);

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found in database' 
      }, { status: 404 });
    }

    const userRole = userRows[0].role;

    if (userRole !== 'facultyMentor') {
      return NextResponse.json({ 
        success: false, 
        error: `User role is ${userRole}, but facultyMentor role is required` 
      }, { status: 403 });
    }

    // Get all submissions from students under these leads that are verified by student leads
    const submissionsQuery = `
      SELECT 
        r.username as studentUsername,
        r.name as studentName,
        sl.name as leadName,
        u.day1Link,
        u.day2Link,
        u.day3Link,
        u.day4Link,
        u.day5Link,
        u.day6Link,
        u.day7Link,
        u.day8Link,
        u.day9Link,
        u.day10Link,
        u.day1Verified,
        u.day2Verified,
        u.day3Verified,
        u.day4Verified,
        u.day5Verified,
        u.day6Verified,
        u.day7Verified,
        u.day8Verified,
        u.day9Verified,
        u.day10Verified,
        a.day1 as day1Attendance,
        a.day2 as day2Attendance,
        a.day3 as day3Attendance,
        a.day4 as day4Attendance,
        a.day5 as day5Attendance,
        a.day6 as day6Attendance,
        a.day7 as day7Attendance,
        a.day8 as day8Attendance,
        a.day9 as day9Attendance,
        a.day10 as day10Attendance
      FROM registrations r
      JOIN studentLeads sl ON r.leadId = sl.username
      JOIN facultyStudentLeads fsl ON sl.id = fsl.studentLeadId
      JOIN facultyMentors fm ON fsl.facultyMentorId = fm.id
      LEFT JOIN uploads u ON r.username = u.username
      LEFT JOIN attendance a ON r.username = a.username
      WHERE fm.username = ?
        AND (
          u.day1Verified = 1 OR
          u.day2Verified = 1 OR
          u.day3Verified = 1 OR
          u.day4Verified = 1 OR
          u.day5Verified = 1 OR
          u.day6Verified = 1 OR
          u.day7Verified = 1 OR
          u.day8Verified = 1 OR
          u.day9Verified = 1 OR
          u.day10Verified = 1
        )
      ORDER BY r.name ASC
    `;

    const [submissions] = await pool.query(submissionsQuery, [username]);

    return NextResponse.json({
      success: true,
      submissions
    });

  } catch (error) {
    console.error('Error in faculty mentor submissions API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 