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
      attendanceMarks,
      taskCompletionMarks,
      problemIdentificationMarks,
      creativeWorkMarks,
      finalReportMarks,
      feedback
    } = await request.json();

    // Calculate total marks
    const totalMarks = attendanceMarks + taskCompletionMarks + problemIdentificationMarks + 
                      creativeWorkMarks + finalReportMarks;

    // Determine grade based on total marks
    let grade;
    if (totalMarks >= 90) {
      grade = 'A';
    } else if (totalMarks >= 75) {
      grade = 'B';
    } else if (totalMarks >= 60) {
      grade = 'C';
    } else {
      grade = 'F';
    }

    // Update or insert marks in the database
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Check if marks already exist for this student
      const [existingMarks] = await connection.execute(
        'SELECT * FROM marks WHERE username = ?',
        [username]
      );

      if (existingMarks.length > 0) {
        // Update existing marks
        await connection.execute(
          `UPDATE marks 
           SET attendanceMarks = ?, 
               taskCompletionMarks = ?, 
               problemIdentificationMarks = ?, 
               creativeWorkMarks = ?, 
               finalReportMarks = ?, 
               totalMarks = ?, 
               grade = ?, 
               feedback = ?,
               updatedAt = CURRENT_TIMESTAMP
           WHERE username = ?`,
          [
            attendanceMarks,
            taskCompletionMarks,
            problemIdentificationMarks,
            creativeWorkMarks,
            finalReportMarks,
            totalMarks,
            grade,
            feedback,
            username
          ]
        );
      } else {
        // Insert new marks
        await connection.execute(
          `INSERT INTO marks 
           (username, facultyMentorId, attendanceMarks, taskCompletionMarks, 
            problemIdentificationMarks, creativeWorkMarks, finalReportMarks, 
            totalMarks, grade, feedback)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            username,
            payload.username,
            attendanceMarks,
            taskCompletionMarks,
            problemIdentificationMarks,
            creativeWorkMarks,
            finalReportMarks,
            totalMarks,
            grade,
            feedback
          ]
        );
      }

      // Update the final table to mark as completed
      await connection.execute(
        `UPDATE final 
         SET completed = TRUE,
             updatedAt = CURRENT_TIMESTAMP
         WHERE username = ?`,
        [username]
      );

      await connection.commit();
      return NextResponse.json({ success: true, message: 'Evaluation submitted successfully' });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in evaluation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit evaluation' },
      { status: 500 }
    );
  }
} 