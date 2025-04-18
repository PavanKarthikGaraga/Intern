import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request) {
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
        error: 'Access denied. Only student leads can verify reports.' 
      }, { status: 403 });
    }

    const { username } = await request.json();

    const [rows] = await pool.query(
      `SELECT r.*, u.name as studentName 
       FROM registrations r 
       JOIN users u ON r.username = u.username 
       WHERE r.studentLeadId = ? AND r.verified = true`,
      [username]
    );

    return NextResponse.json({ 
      success: true,
      completedStudents: rows 
    });
  } catch (error) {
    console.error('Error fetching completed students:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 