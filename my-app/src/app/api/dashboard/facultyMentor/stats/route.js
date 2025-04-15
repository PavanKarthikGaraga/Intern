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

    // Get total student leads assigned to this faculty mentor
    const leadsQuery = `
      SELECT COUNT(*) as totalLeads
      FROM facultyStudentLeads fsl
      JOIN facultyMentors fm ON fsl.facultyMentorId = fm.id
      WHERE fm.username = ?
    `;

    const [leadsResult] = await pool.query(leadsQuery, [username]);
    const totalLeads = leadsResult[0].totalLeads;

    // Get total students under these leads
    const studentsQuery = `
      SELECT COUNT(*) as totalStudents
      FROM registrations r
      JOIN studentLeads sl ON r.leadId = sl.username
      JOIN facultyStudentLeads fsl ON sl.id = fsl.studentLeadId
      JOIN facultyMentors fm ON fsl.facultyMentorId = fm.id
      WHERE fm.username = ?
    `;

    const [studentsResult] = await pool.query(studentsQuery, [username]);
    const totalStudents = studentsResult[0].totalStudents;

    // Get verified and pending submissions
    const submissionsQuery = `
      SELECT 
        COUNT(CASE WHEN u.day1Verified = 1 THEN 1 END) +
        COUNT(CASE WHEN u.day2Verified = 1 THEN 1 END) +
        COUNT(CASE WHEN u.day3Verified = 1 THEN 1 END) +
        COUNT(CASE WHEN u.day4Verified = 1 THEN 1 END) +
        COUNT(CASE WHEN u.day5Verified = 1 THEN 1 END) +
        COUNT(CASE WHEN u.day6Verified = 1 THEN 1 END) +
        COUNT(CASE WHEN u.day7Verified = 1 THEN 1 END) +
        COUNT(CASE WHEN u.day8Verified = 1 THEN 1 END) +
        COUNT(CASE WHEN u.day9Verified = 1 THEN 1 END) +
        COUNT(CASE WHEN u.day10Verified = 1 THEN 1 END) as verifiedSubmissions,
        COUNT(CASE WHEN u.day1Verified IS NULL AND u.day1Link IS NOT NULL THEN 1 END) +
        COUNT(CASE WHEN u.day2Verified IS NULL AND u.day2Link IS NOT NULL THEN 1 END) +
        COUNT(CASE WHEN u.day3Verified IS NULL AND u.day3Link IS NOT NULL THEN 1 END) +
        COUNT(CASE WHEN u.day4Verified IS NULL AND u.day4Link IS NOT NULL THEN 1 END) +
        COUNT(CASE WHEN u.day5Verified IS NULL AND u.day5Link IS NOT NULL THEN 1 END) +
        COUNT(CASE WHEN u.day6Verified IS NULL AND u.day6Link IS NOT NULL THEN 1 END) +
        COUNT(CASE WHEN u.day7Verified IS NULL AND u.day7Link IS NOT NULL THEN 1 END) +
        COUNT(CASE WHEN u.day8Verified IS NULL AND u.day8Link IS NOT NULL THEN 1 END) +
        COUNT(CASE WHEN u.day9Verified IS NULL AND u.day9Link IS NOT NULL THEN 1 END) +
        COUNT(CASE WHEN u.day10Verified IS NULL AND u.day10Link IS NOT NULL THEN 1 END) as pendingSubmissions
      FROM uploads u
      JOIN registrations r ON u.username = r.username
      JOIN studentLeads sl ON r.leadId = sl.username
      JOIN facultyStudentLeads fsl ON sl.id = fsl.studentLeadId
      JOIN facultyMentors fm ON fsl.facultyMentorId = fm.id
      WHERE fm.username = ?
    `;

    const [submissionsResult] = await pool.query(submissionsQuery, [username]);

    return NextResponse.json({
      success: true,
      stats: {
        totalLeads,
        totalStudents,
        verifiedSubmissions: submissionsResult[0].verifiedSubmissions,
        pendingSubmissions: submissionsResult[0].pendingSubmissions
      }
    });

  } catch (error) {
    console.error('Error in faculty mentor stats API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 