import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

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
        error: 'Access denied. Only faculty mentors can verify reports.' 
      }, { status: 403 });
    }

    const { username, day, verified } = await request.json();

    // Validate inputs
    if (!username || !day || typeof verified !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request data. Username, day, and verified status are required.' 
      }, { status: 400 });
    }

    if (day < 1 || day > 7) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid day. Day must be between 1 and 7.' 
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

    // Check if report exists for the day
    const [reportCheck] = await connection.query(
      `SELECT 1 FROM uploads 
       WHERE username = ? AND day${day} IS NOT NULL`,
      [username]
    );

    if (reportCheck.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No report found for this day.' 
      }, { status: 404 });
    }

    // Update verify table
    const [verifyCheck] = await connection.query(
      `SELECT 1 FROM verify WHERE username = ?`,
      [username]
    );

    if (verifyCheck.length === 0) {
      await connection.query(
        `INSERT INTO verify (username, day${day}) VALUES (?, ?)`,
        [username, verified]
      );
    } else {
      await connection.query(
        `UPDATE verify SET day${day} = ? WHERE username = ?`,
        [verified, username]
      );
    }

    // Update status table
    const [statusCheck] = await connection.query(
      `SELECT 1 FROM status WHERE username = ?`,
      [username]
    );

    if (statusCheck.length === 0) {
      await connection.query(
        `INSERT INTO status (username, day${day}) VALUES (?, NULL)`,
        [username]
      );
    } else {
      await connection.query(
        `UPDATE status SET day${day} = NULL WHERE username = ?`,
        [username]
      );
    }

    // If verified is false, reset attendance for that day
    if (!verified) {
      await connection.query(
        `UPDATE attendance SET day${day} = NULL WHERE username = ?`,
        [username]
      );
    }

    return NextResponse.json({
      success: true,
      message: `Report has been ${verified ? 'verified' : 'rejected'}.`
    });

  } catch (error) {
    console.error('Error in verify POST:', error);
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

// GET endpoint to fetch verification status for a student
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
        error: 'Access denied. Only faculty mentors can access verification status.' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student username is required.' 
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

    // Get verification status
    const [verificationStatus] = await connection.query(
      `SELECT day1, day2, day3, day4, day5, day6, day7 
       FROM verify 
       WHERE username = ?`,
      [username]
    );

    return NextResponse.json({
      success: true,
      data: verificationStatus[0] || {
        day1: false,
        day2: false,
        day3: false,
        day4: false,
        day5: false,
        day6: false,
        day7: false
      }
    });

  } catch (error) {
    console.error('Error in verify GET:', error);
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