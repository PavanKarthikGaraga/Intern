import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAccessToken(token);
    if (payload.role !== 'facultyMentor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      username,
      day,
      marks
    } = await request.json();

    if (!username || !day || marks === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if daily marks exist for this student
      const [existingMarks] = await connection.execute(
        'SELECT * FROM dailyMarks WHERE username = ?',
        [username]
      );

      if (existingMarks.length > 0) {
        // Update existing marks
        await connection.query(
          `UPDATE dailyMarks 
           SET day${day} = ?,
               internalMarks = (
                 SELECT COALESCE(SUM(day1 + day2 + day3 + day4 + day5 + day6 + day7), 0)
                 FROM dailyMarks
                 WHERE username = ?
               )
           WHERE username = ?`,
          [marks, username, username]
        );
      } else {
        // Insert new marks
        await connection.query(
          `INSERT INTO dailyMarks (username, day${day}, internalMarks)
           VALUES (?, ?, ?)`,
          [username, marks, marks]
        );
      }

      await connection.commit();
      return NextResponse.json({ success: true, message: 'Daily marks updated successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in daily marks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update daily marks' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAccessToken(token);
    if (payload.role !== 'facultyMentor') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();
    try {
      const [marks] = await connection.execute(
        'SELECT * FROM dailyMarks WHERE username = ?',
        [username]
      );

      return NextResponse.json({
        success: true,
        marks: marks[0] || null
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error fetching daily marks:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch daily marks' },
      { status: 500 }
    );
  }
} 