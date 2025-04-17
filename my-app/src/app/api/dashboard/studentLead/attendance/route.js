import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request) {
  try {
    const { username, day, status } = await request.json();

    // Validate input
    if (!username || !day || !status) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate day is between 1 and 7
    if (day < 1 || day > 7) {
      return NextResponse.json(
        { success: false, error: 'Invalid day number' },
        { status: 400 }
      );
    }

    // Validate status is either 'P' or 'A'
    if (status !== 'P' && status !== 'A') {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get a connection from the pool
    const db = await pool.getConnection();

    try {
      // Check if attendance record exists
      const [existingRecords] = await db.execute(
        'SELECT * FROM attendance WHERE username = ?',
        [username]
      );

      if (existingRecords.length === 0) {
        // Create new attendance record
        await db.execute(
          `INSERT INTO attendance (username, day${day}) VALUES (?, ?)`,
          [username, status]
        );
      } else {
        // Update existing attendance record
        await db.execute(
          `UPDATE attendance SET day${day} = ? WHERE username = ?`,
          [status, username]
        );
      }

      return NextResponse.json({ success: true });
    } finally {
      // Release the connection back to the pool
      db.release();
    }
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update attendance' },
      { status: 500 }
    );
  }
} 