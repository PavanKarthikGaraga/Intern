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
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only admin can evaluate special student marks.' 
      }, { status: 403 });
    }

    const body = await request.json();
    if (!body || !body.username) {
      return NextResponse.json({ 
        success: false, 
        error: 'Username is required.' 
      }, { status: 400 });
    }

    const {
      username,
      finalReportMarks,
      finalPresentationMarks,
      feedback
    } = body;

    const db = await pool.getConnection();
    try {
      // Ensure the user is a sstudent
      const [sstudentCheck] = await db.query(
        `SELECT 1 FROM sstudents WHERE username = ?`,
        [username]
      );
      if (sstudentCheck.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Special student not found.' 
        }, { status: 404 });
      }

      // Ensure a row exists in marks for this sstudent
      const [existingMarks] = await db.query(
        `SELECT 1 FROM marks WHERE username = ?`,
        [username]
      );
      if (existingMarks.length === 0) {
        // Get internal marks from sdailyMarks
        const [daily] = await db.query(
          `SELECT internalMarks FROM sdailyMarks WHERE username = ?`,
          [username]
        );
        const internal = daily.length > 0 ? Number(daily[0].internalMarks) || 0 : 0;
        // Insert with admin as facultyMentorId (or NULL)
        await db.query(
          `INSERT INTO marks (username, facultyMentorId, internalMarks) VALUES (?, NULL, ?)`,
          [username, internal]
        );
      }

      // Always sync internalMarks in marks table from sdailyMarks before calculation
      const [daily] = await db.query(
        `SELECT internalMarks FROM sdailyMarks WHERE username = ?`,
        [username]
      );
      const internal = daily.length > 0 ? Number(daily[0].internalMarks) || 0 : 0;
      await db.query(
        `UPDATE marks SET internalMarks = ? WHERE username = ?`,
        [internal, username]
      );

      // If marks are provided, update them along with completed status
      if (finalReportMarks !== undefined && finalPresentationMarks !== undefined) {
        // Use the just-updated internalMarks for calculation
        const totalMarks = internal + finalReportMarks + finalPresentationMarks;

        // Determine grade based on total marks
        let grade = 'Not Qualified';
        if (totalMarks >= 90) {
          grade = 'Certificate of Excellence';
        } else if (totalMarks >= 75) {
          grade = 'Certificate of Appreciation';
        } else if (totalMarks >= 60) {
          grade = 'Certificate of Participation';
        }

        // Update marks and completed status
        await db.query(
          `UPDATE marks 
           SET finalReport = ?,
               finalPresentation = ?,
               totalMarks = ?,
               grade = ?,
               feedback = ?,
               completed = 'P'
           WHERE username = ?`,
          [
            finalReportMarks,
            finalPresentationMarks,
            totalMarks,
            grade,
            feedback,
            username
          ]
        );

        // Also update final.completed to 1
        await db.query(
          `UPDATE final SET completed = 1 WHERE username = ?`,
          [username]
        );

        return NextResponse.json({
          success: true,
          message: 'Marks evaluated and accepted successfully'
        });
      } else {
        // If no marks provided, just update completed status
        await db.query(
          `UPDATE marks 
           SET completed = 'P' 
           WHERE username = ?`,
          [username]
        );

        return NextResponse.json({
          success: true,
          message: 'Marks accepted successfully'
        });
      }
    } finally {
      db.release();
    }
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 