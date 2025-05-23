import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

export async function POST(req) {
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
        error: 'Access denied. Only student leads can update attendance.' 
      }, { status: 403 });
    }

    const { username, day, status } = await req.json();

    if (!username || !day || !status) {
      return NextResponse.json(
        { success: false, message: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // Validate status
    if (!['P', 'A', 'S'].includes(status)) {
      return NextResponse.json(
        { success: false, message: 'Invalid attendance status' },
        { status: 400 }
      );
    }

    // First, check if the record exists
    const [existing] = await pool.query(
      `SELECT * FROM attendance WHERE username = ?`,
      [username]
    );

    if (existing.length === 0) {
      // Create a new record if it doesn't exist
      await pool.query(
        `INSERT INTO attendance (username, day${day}) VALUES (?, ?)`,
        [username, status]
      );
    } else {
      // Update the existing record
      await pool.query(
        `UPDATE attendance SET day${day} = ? WHERE username = ?`,
        [status, username]
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 