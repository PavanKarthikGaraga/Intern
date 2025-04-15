import { NextResponse } from 'next/server';
import {pool} from '@/config/db';
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

    // First verify the user exists and get their role
    const userQuery = 'SELECT role FROM users WHERE username = ?';
    const [userRows] = await pool.query(userQuery, [username]);

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found in database' 
      }, { status: 404 });
    }

    const userRole = userRows[0].role;

    if (userRole !== 'studentLead') {
      return NextResponse.json({ 
        success: false, 
        error: `User role is ${userRole}, but studentLead role is required` 
      }, { status: 403 });
    }

    // Get total students assigned to this lead
    const totalStudentsQuery = `
      SELECT COUNT(*) as total
      FROM registrations
      WHERE leadId = ?
    `;
    const [totalStudentsResult] = await pool.query(totalStudentsQuery, [username]);

    // Get completed students count
    const completedStudentsQuery = `
      SELECT COUNT(*) as completed
      FROM registrations
      WHERE leadId = ? AND completed = true
    `;
    const [completedStudentsResult] = await pool.query(completedStudentsQuery, [username]);

    // Get current students count (not completed)
    const currentStudentsQuery = `
      SELECT COUNT(*) as current
      FROM registrations
      WHERE leadId = ? AND completed = false
    `;
    const [currentStudentsResult] = await pool.query(currentStudentsQuery, [username]);

    return NextResponse.json({
      success: true,
      totalStudents: totalStudentsResult[0].total,
      completedStudents: completedStudentsResult[0].completed,
      currentStudents: currentStudentsResult[0].current
    });

  } catch (error) {
    console.error('Error in student lead data API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 