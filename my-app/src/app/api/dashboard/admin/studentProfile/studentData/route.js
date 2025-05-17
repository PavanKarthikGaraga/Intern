import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(request) {
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
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only admin members can access this data.' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // Get all student data in parallel
      const [submissions, attendance, marks, verification] = await Promise.all([
        connection.query('SELECT * FROM uploads WHERE username = ?', [username]),
        connection.query('SELECT * FROM attendance WHERE username = ?', [username]),
        connection.query('SELECT * FROM dailyMarks WHERE username = ?', [username]),
        connection.query('SELECT * FROM verify WHERE username = ?', [username])
      ]);

      // Get registration data for internal marks calculation
      const [registration] = await connection.query(
        'SELECT slot FROM registrations WHERE username = ?',
        [username]
      );

      // Calculate internal marks based on daily marks
      let internalMarks = 0;
      if (marks[0] && marks[0][0]) {
        const dailyMarks = marks[0][0];
        for (let i = 1; i <= 7; i++) {
          const val = parseFloat(dailyMarks[`day${i}`]);
          internalMarks += isNaN(val) ? 0 : val;
        }
        // Add +1 if all 7 days are submitted
        if (registration[0] && registration[0].slot) {
          const allDaysSubmitted = Array.from({ length: 7 }, (_, i) => i + 1)
            .every(day => parseFloat(dailyMarks[`day${day}`]) > 0);
          if (allDaysSubmitted) {
            internalMarks += 1;
          }
        }
        // Ensure internalMarks is a valid decimal with 2 places
        internalMarks = Number(internalMarks.toFixed(2));
      }

      // Update internal marks in dailyMarks table
      if (marks[0] && marks[0][0]) {
        await connection.query(
          'UPDATE dailyMarks SET internalMarks = ? WHERE username = ?',
          [internalMarks, username]
        );
      }

      return NextResponse.json({
        submissions: submissions[0][0] || {},
        attendance: attendance[0][0] || {},
        marks: marks[0][0] || {},
        verification: verification[0][0] || {},
        internalMarks
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

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
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only admin members can access this data.' 
      }, { status: 403 });
    }


    const { username, day, status, marks } = await request.json();

    if (!username || !day || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
      // Update attendance
      await connection.query(
        'UPDATE attendance SET day' + day + ' = ? WHERE username = ?',
        [status, username]
      );

      // If present, update verification and marks
      if (status === 'P') {
        await connection.query(
          'UPDATE verify SET day' + day + ' = TRUE WHERE username = ?',
          [username]
        );
      
        if (marks !== undefined) {
          const [mark] = await connection.query(
            'SELECT * FROM dailyMarks WHERE username = ?',
            [username]
          );
      
          if (mark[0]) {
            await connection.query(
              'UPDATE dailyMarks SET day' + day + ' = ? WHERE username = ?',
              [marks, username]
            );
          } else {
            const insertQuery = `
              INSERT INTO dailyMarks (username, day${day})
              VALUES (?, ?)
            `;
            await connection.query(insertQuery, [username, marks]);
          }
        }
      }      

      return NextResponse.json({ message: 'Updated successfully' });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 