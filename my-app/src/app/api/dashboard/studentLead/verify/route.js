import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req) {
  try {
    const { username, day, status } = await req.json();

    if (!username || !day || typeof status !== 'boolean') {
      return NextResponse.json(
        { success: false, message: 'Invalid request parameters' },
        { status: 400 }
      );
    }

    // First, check if the record exists
    const [existing] = await pool.query(
      `SELECT * FROM verify WHERE username = ?`,
      [username]
    );

    if (existing.length === 0) {
      // Create a new record if it doesn't exist
      await pool.query(
        `INSERT INTO verify (username, day${day}) VALUES (?, ?)`,
        [username, status]
      );
    } else {
      // Update the existing record
      await pool.query(
        `UPDATE verify SET day${day} = ? WHERE username = ?`,
        [status, username]
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating verification:', error);
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    );
  }
} 