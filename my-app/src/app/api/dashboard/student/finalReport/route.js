import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import pool from '@/lib/db';
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
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only students can view final report status.' 
      }, { status: 403 });
    }

    const db = await pool.getConnection();
    try {
      // First check if student exists in registrations
      const [registration] = await db.query(
        `SELECT verified FROM registrations WHERE username = ?`,
        [decoded.username]
      );

      if (!registration || registration.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Student registration not found.' 
        }, { status: 404 });
      }

      // Then check final table
      const [final] = await db.query(
        `SELECT finalReport, completed FROM final WHERE username = ?`,
        [decoded.username]
      );

      console.log('Registration:', registration[0]);
      console.log('Final:', final[0]);

      return NextResponse.json({ 
        success: true,
        data: {
          verified: registration[0].verified === 1, // Convert to boolean since MySQL uses 1/0
          finalReport: final[0]?.finalReport || null,
          completed: final[0]?.completed === 1 || false, // Convert to boolean
          slotEndTimes: {
            1: '2024-05-20',
            2: '2024-05-27',
            3: '2024-06-03',
            4: '2024-06-10'
          }
        }
      });
    } finally {
      db.release();
    }
  } catch (error) {
    console.error('Error fetching final report status:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
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
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only students can submit final reports.' 
      }, { status: 403 });
    }

    const body = await request.json();
    const { finalReport } = body;

    if (!finalReport) {
      return NextResponse.json({ 
        success: false, 
        error: 'Final report is required.' 
      }, { status: 400 });
    }

    const db = await pool.getConnection();
    try {
      // First check if student exists in registrations and is verified
      const [registration] = await db.query(
        `SELECT verified, facultyMentorId, slot FROM registrations WHERE username = ?`,
        [decoded.username]
      );

      if (!registration || registration.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Student registration not found.' 
        }, { status: 404 });
      }

      if (registration[0].verified !== 1) { // Check for 1 since MySQL uses 1/0
        return NextResponse.json({ 
          success: false, 
          error: 'Student not verified.' 
        }, { status: 403 });
      }

      // Check if submission is past deadline
      const slotEndTimes = {
        1: '2024-05-20',
        2: '2024-05-27',
        3: '2024-06-03',
        4: '2024-06-10'
      };
      
      const currentDate = new Date().toISOString().split('T')[0];
      const deadline = slotEndTimes[registration[0].slot];
      
      if (currentDate > deadline) {
        return NextResponse.json({ 
          success: false, 
          error: `Final report submission deadline for your slot (${deadline}) has passed.` 
        }, { status: 403 });
      }

      // Check if record exists in final table
      const [existing] = await db.query(
        `SELECT username FROM final WHERE username = ?`,
        [decoded.username]
      );

      if (!existing || existing.length === 0) {
        // Insert new record
        await db.query(
          `INSERT INTO final (username, facultyMentorId, finalReport)
           VALUES (?, ?, ?)`,
          [decoded.username, registration[0].facultyMentorId, finalReport]
        );
      } else {
        // Update existing record
        await db.query(
          `UPDATE final SET finalReport = ? WHERE username = ?`,
          [finalReport, decoded.username]
        );
      }

      return NextResponse.json({ 
        success: true,
        message: 'Final report submitted successfully.'
      });
    } finally {
      db.release();
    }
  } catch (error) {
    console.error('Error submitting final report:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 