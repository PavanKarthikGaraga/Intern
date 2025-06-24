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
    if (!decoded || decoded.role !== 'facultyMentor') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only faculty mentors can evaluate marks.' 
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
      // Check if the student belongs to this faculty mentor
      const [studentCheck] = await db.query(
        `SELECT 1 FROM registrations 
         WHERE username = ? AND facultyMentorId = ?`,
        [username, decoded.username]
      );

      if (studentCheck.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'Student not found or not assigned to you.' 
        }, { status: 404 });
      }

      // Ensure a row exists in marks for this student
      const [existingMarks] = await db.query(
        `SELECT 1 FROM marks WHERE username = ? AND facultyMentorId = ?`,
        [username, decoded.username]
      );
      if (existingMarks.length === 0) {
        // Get internal marks from dailyMarks
        const [daily] = await db.query(
          `SELECT internalMarks FROM dailyMarks WHERE username = ?`,
          [username]
        );
        const internal = daily.length > 0 ? Number(daily[0].internalMarks) || 0 : 0;
        await db.query(
          `INSERT INTO marks (username, facultyMentorId, internalMarks) VALUES (?, ?, ?)`,
          [username, decoded.username, internal]
        );
      }

      // Always sync internalMarks in marks table from dailyMarks before calculation
      const [daily] = await db.query(
        `SELECT internalMarks FROM dailyMarks WHERE username = ?`,
        [username]
      );
      const internal = daily.length > 0 ? Number(daily[0].internalMarks) || 0 : 0;
      await db.query(
        `UPDATE marks SET internalMarks = ? WHERE username = ? AND facultyMentorId = ?`,
        [internal, username, decoded.username]
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
           WHERE username = ? AND facultyMentorId = ?`,
          [
            finalReportMarks,
            finalPresentationMarks,
            totalMarks,
            grade,
            feedback,
            username,
            decoded.username
          ]
        );

        // Also update final.completed to 1 so studentLead UI shows grade
        await db.query(
          `UPDATE final SET completed = 1 WHERE username = ?`,
          [username]
        );

        await db.query(
          "UPDATE registrations SET pass = 'P' WHERE username = ?",
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
           WHERE username = ? AND facultyMentorId = ?`,
          [username, decoded.username]
        );

        await db.query(
          "UPDATE registrations SET pass = 'P' WHERE username = ?",
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
    console.error('Error in evaluate marks API:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 