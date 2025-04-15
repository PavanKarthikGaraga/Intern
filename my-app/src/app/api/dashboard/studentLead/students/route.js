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

    // Verify that the user is a student lead
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

    // Get all students assigned to this lead
    const studentsQuery = `
      SELECT 
        name,
        username,
        selectedDomain,
        mode,
        completed,
        email,
        branch,
        year,
        phoneNumber
      FROM registrations
      WHERE leadId = ?
      ORDER BY name ASC
    `;

    const [students] = await pool.query(studentsQuery, [username]);

    return NextResponse.json({
      success: true,
      students
    });

  } catch (error) {
    console.error('Error in student lead students API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 