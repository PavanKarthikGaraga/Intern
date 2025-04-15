import { NextResponse } from 'next/server';
import pool from '@/config/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    // Get token from cookies and verify
    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('accessToken');

    if (!accessToken?.value) {
      return NextResponse.json({ 
        success: false, 
        message: 'Authentication token is missing. Please login again.' 
      }, { status: 401 });
    }

    const decoded = await verifyAccessToken(accessToken.value);
    if (!decoded) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid or expired token. Please login again.' 
      }, { status: 401 });
    }

    const { username } = decoded;

    // Verify that the user is a student lead
    const userQuery = 'SELECT role FROM users WHERE username = ?';
    const [userResult] = await pool.query(userQuery, [username]);

    if (!userResult || userResult.role !== 'studentLead') {
      return NextResponse.json({ 
        success: false, 
        message: 'You do not have permission to access this resource. Only student leads can access this page.' 
      }, { status: 403 });
    }

    // Get attendance records for all students assigned to this lead
    const attendanceQuery = `
      SELECT 
        r.name,
        r.username,
        a.date,
        a.status,
        a.remarks
      FROM registrations r
      LEFT JOIN attendance a ON a.studentUsername = r.username
      WHERE r.leadId = ?
      ORDER BY a.date DESC, r.name ASC
    `;

    const [attendanceRecords] = await pool.query(attendanceQuery, [username]);

    return NextResponse.json({
      success: true,
      attendance: attendanceRecords
    });

  } catch (error) {
    console.error('Error in student lead attendance API:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An unexpected error occurred while fetching attendance records. Please try again later.' 
      },
      { status: 500 }
    );
  }
} 