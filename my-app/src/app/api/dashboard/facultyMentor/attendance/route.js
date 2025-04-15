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

    const { username, studentUsername, day, status } = await req.json();

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

    // Verify that the student is under this faculty mentor's leads
    const verifyStudentQuery = `
      SELECT 1
      FROM registrations r
      JOIN studentLeads sl ON r.leadId = sl.username
      JOIN facultyStudentLeads fsl ON sl.id = fsl.studentLeadId
      JOIN facultyMentors fm ON fsl.facultyMentorId = fm.id
      WHERE fm.username = ? AND r.username = ?
    `;

    const [studentRows] = await pool.query(verifyStudentQuery, [username, studentUsername]);

    if (!studentRows || studentRows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student not found under your leads' 
      }, { status: 404 });
    }

    // Verify that the submission is verified by student lead
    const verifySubmissionQuery = `
      SELECT 1
      FROM uploads
      WHERE username = ? AND day${day}Verified = 1
    `;

    const [submissionRows] = await pool.query(verifySubmissionQuery, [studentUsername]);

    if (!submissionRows || submissionRows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Submission not verified by student lead' 
      }, { status: 400 });
    }

    // Check if attendance record exists
    const checkAttendanceQuery = 'SELECT 1 FROM attendance WHERE username = ?';
    const [attendanceRows] = await pool.query(checkAttendanceQuery, [studentUsername]);

    if (attendanceRows && attendanceRows.length > 0) {
      // Update existing attendance
      const updateQuery = `UPDATE attendance SET day${day} = ? WHERE username = ?`;
      await pool.query(updateQuery, [status, studentUsername]);
    } else {
      // Create new attendance record
      const insertQuery = `
        INSERT INTO attendance (username, day${day})
        VALUES (?, ?)
      `;
      await pool.query(insertQuery, [studentUsername, status]);
    }

    return NextResponse.json({
      success: true,
      message: 'Attendance marked successfully'
    });

  } catch (error) {
    console.error('Error in faculty mentor attendance API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 