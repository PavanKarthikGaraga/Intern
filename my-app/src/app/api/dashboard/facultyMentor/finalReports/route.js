import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export async function GET(request) {
  const connection = await pool.getConnection();
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
    if (!decoded || decoded.role !== 'facultyMentor') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only faculty mentors can access this resource.' 
      }, { status: 403 });
    }

    // Get students with submitted final reports
    const [submittedReports] = await connection.query(
      `SELECT 
        r.username,
        r.name,
        r.email,
        r.phoneNumber,
        r.branch,
        r.year,
        r.mode,
        r.slot,
        sl.name as studentLeadName,
        sl.username as studentLeadUsername,
        f.finalReport,
        f.completed,
        dm.internalMarks
      FROM registrations r
      INNER JOIN final f ON r.username = f.username
      LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
      LEFT JOIN dailyMarks dm ON r.username = dm.username
      WHERE r.facultyMentorId = ? AND f.finalReport IS NOT NULL
      ORDER BY r.name ASC`,
      [decoded.username]
    );

    // Get students in final table but without reports
    const [pendingReports] = await connection.query(
      `SELECT 
        r.username,
        r.name,
        r.email,
        r.phoneNumber,
        r.branch,
        r.year,
        r.mode,
        r.slot,
        sl.name as studentLeadName,
        sl.username as studentLeadUsername
      FROM registrations r
      INNER JOIN final f ON r.username = f.username
      LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
      WHERE r.facultyMentorId = ? AND f.finalReport IS NULL
      ORDER BY r.name ASC`,
      [decoded.username]
    );

    return NextResponse.json({
      success: true,
      data: {
        submittedReports,
        pendingReports
      }
    });

  } catch (error) {
    console.error('Error in final reports GET:', error);
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

export async function POST(request) {
  const connection = await pool.getConnection();
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
    if (!decoded || decoded.role !== 'facultyMentor') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only faculty mentors can access this resource.' 
      }, { status: 403 });
    }

    const { username, completed } = await request.json();

    if (!username || typeof completed !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request data. Username and completed status are required.' 
      }, { status: 400 });
    }

    // Check if the student belongs to this faculty mentor
    const [studentCheck] = await connection.query(
      `SELECT 1 FROM registrations 
       WHERE username = ? AND facultyMentorId = ?`,
      [username, decoded.username]
    );

    if (studentCheck.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student not found or not assigned to you.' 
      }, { status: 404 });
    }

    // Update completion status
    await connection.query(
      `UPDATE final SET completed = ? WHERE username = ?`,
      [completed, username]
    );

    return NextResponse.json({
      success: true,
      message: `Final report has been ${completed ? 'marked as completed' : 'marked as pending'}.`
    });

  } catch (error) {
    console.error('Error in final reports POST:', error);
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