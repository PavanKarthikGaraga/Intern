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

      if (status === false) {
        // If rejected, set attendance to 'A' and status to NULL
        await connection.query(
          `UPDATE attendance SET day${day} = 'A' WHERE username = ?`,
          [username]
        );
        // Set status to NULL (not 'new')
        const [statusRecord] = await connection.query(
          `SELECT * FROM status WHERE username = ?`,
          [username]
        );
        if (statusRecord.length === 0) {
          await connection.query(
            `INSERT INTO status (username, day${day}) VALUES (?, NULL)` ,
            [username]
          );
        } else {
          await connection.query(
            `UPDATE status SET day${day} = NULL WHERE username = ?`,
            [username]
          );
        }
      }

      if (status === true) {
        // Set status to NULL (clear 'new' if present)
        const [statusRecord] = await connection.query(
          `SELECT * FROM status WHERE username = ?`,
          [username]
        );
        if (statusRecord.length === 0) {
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