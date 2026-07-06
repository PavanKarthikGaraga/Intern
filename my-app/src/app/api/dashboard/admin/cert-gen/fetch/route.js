import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import db from '@/lib/db';

export async function GET(request) {
  const cookieStore = await cookies();
  const accessToken = await cookieStore.get('accessToken');

  if (!accessToken?.value) {
    return NextResponse.json({
      success: false,
      error: 'Authentication required. Please login again.',
    }, { status: 401 });
  }

  const decoded = await verifyAccessToken(accessToken.value);
  if (!decoded || decoded.role !== 'admin') {
    return NextResponse.json({
      success: false,
      error: 'Access denied. Only admins can access this data.',
    }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student ID (username) is required.' 
      }, { status: 400 });
    }

    const [rows] = await db.query(
      'SELECT name, branch, username, slot, mode, selectedDomain, season FROM registrations WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `No student found with ID ${username}` 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      student: rows[0]
    });

  } catch (error) {
    console.error('Error fetching student for cert gen:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error while fetching student data.' 
    }, { status: 500 });
  }
}
