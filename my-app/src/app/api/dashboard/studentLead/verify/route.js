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
        error: 'Access denied. Only student leads can verify reports.' 
      }, { status: 403 });
    }

    const { username, day, status } = await req.json();

    if (!username || !day || typeof status !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    const connection = await pool.getConnection();
    try {
      // First, check if the record exists in verify table
      const [existing] = await connection.query(
        `SELECT * FROM verify WHERE username = ?`,
        [username]
      );

      if (existing.length === 0) {
        // Create a new record if it doesn't exist
        await connection.query(
          `INSERT INTO verify (username, day${day}) VALUES (?, ?)`,
          [username, status]
        );
      } else {
        // Update the existing record
        await connection.query(
          `UPDATE verify SET day${day} = ? WHERE username = ?`,
          [status, username]
        );
      }

      // Check if status record exists
      const [statusRecord] = await connection.query(
        `SELECT * FROM status WHERE username = ?`,
        [username]
      );

      if (statusRecord.length === 0) {
        // Create new status record
        await connection.query(
          `INSERT INTO status (username, day${day}) VALUES (?, ?)`,
          [username, status ? null : 'new']
        );
      } else {
        // Update status record
        await connection.query(
          `UPDATE status SET day${day} = ? WHERE username = ?`,
          [status ? null : 'new', username]
        );
      }

      // If status is false (rejected), reset attendance
      if (!status) {
        await connection.query(
          `UPDATE attendance SET day${day} = NULL WHERE username = ?`,
          [username]
        );
      }

      return NextResponse.json({ success: true });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error updating verification:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 