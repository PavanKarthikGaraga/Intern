import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

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
    if (!decoded || decoded.role !== 'studentLead') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only student leads can access this data.' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    // Get registration info
    const [students] = await pool.query(
      `SELECT r.*, u.name, u.role FROM registrations r JOIN users u ON r.username = u.username WHERE r.username = ?`,
      [username]
    );
    if (!students.length) {
      return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
    }
    const student = students[0];

    // Get attendance info
    const [attendanceRows] = await pool.query(
      `SELECT day1, day2, day3, day4, day5, day6, day7 FROM attendance WHERE username = ?`,
      [username]
    );
    const attendance = attendanceRows[0] || {};

    // Get verification info
    const [verifyRows] = await pool.query(
      `SELECT day1, day2, day3, day4, day5, day6, day7 FROM verify WHERE username = ?`,
      [username]
    );
    const verify = verifyRows[0] || {};

    // Get status info
    const [statusRows] = await pool.query(
      `SELECT day1, day2, day3, day4, day5, day6, day7 FROM status WHERE username = ?`,
      [username]
    );
    // Only include status if a row exists
    const status = statusRows.length > 0 ? statusRows[0] : undefined;

    // Get uploads info
    const [uploadsRows] = await pool.query(
      `SELECT day1, day2, day3, day4, day5, day6, day7, updatedAt FROM uploads WHERE username = ?`,
      [username]
    );
    const uploadsRaw = uploadsRows[0] || {};
    // Convert uploads to array for modal
    const uploads = [1,2,3,4,5,6,7].map(day => ({
      dayNumber: day,
      link: uploadsRaw[`day${day}`] || null,
      updatedAt: uploadsRaw.updatedAt || null
    }));

    // Get daily marks info
    const [marksRows] = await pool.query(
      `SELECT day1, day2, day3, day4, day5, day6, day7 FROM dailyMarks WHERE username = ?`,
      [username]
    );
    const dailyMarks = marksRows[0] || {};

    return NextResponse.json({
      success: true,
      student: {
        ...student,
        attendance: {
          details: attendance
        },
        verify: verify,
        ...(status !== undefined ? { status } : {}),
        uploads: {
          details: uploads
        },
        dailyMarks: dailyMarks
      }
    });
  } catch (error) {
    console.error('Error fetching student data:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 