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
      caseStudyReportMarks,
      conductParticipationMarks,
      feedback,
      internalMarks
    } = await request.json();

    // Calculate total marks (internal + external)
    const totalMarks = internalMarks + caseStudyReportMarks + conductParticipationMarks;

    // Determine grade based on total marks
    let grade;
    if (totalMarks >= 90) {
      grade = 'Certificate of Excellence';
    } else if (totalMarks >= 75) {
      grade = 'Certificate of Appreciation';
    } else if (totalMarks >= 60) {
      grade = 'Certificate of Participation';
    } else {
      grade = 'Not Qualified';
    }

    let connection = await pool.getConnection();

    // Check if marks already exist for this student
    const [existingMarks] = await connection.execute(
      'SELECT * FROM marks WHERE username = ?',
      [username]
    );

    if (existingMarks.length > 0) {
      // Update existing marks
      await connection.execute(
        `UPDATE marks 
         SET internalMarks = ?, 
             caseStudyReportMarks = ?, 
             conductParticipationMarks = ?, 
             totalMarks = ?, 
             grade = ?, 
             feedback = ?,
             updatedAt = CURRENT_TIMESTAMP
         WHERE username = ?`,
        [
          internalMarks,
          caseStudyReportMarks,
          conductParticipationMarks,
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
         (username, facultyMentorId, internalMarks, caseStudyReportMarks, 
          conductParticipationMarks, totalMarks, grade, feedback)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          username,
          payload.username,
          internalMarks,
          caseStudyReportMarks,
          conductParticipationMarks,
          totalMarks,
          grade,
          feedback
        ]
      );
    }

    // Update the final table to mark as completed
    await connection.execute(
      `UPDATE final 
       SET completed = TRUE
       WHERE username = ?`,
      [username]
    );

    await connection.commit();
    return NextResponse.json({ success: true, message: 'Evaluation submitted successfully' });
  } catch (error) {
    console.error('Error in evaluation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to submit evaluation' },
      { status: 500 }
    );
  }
} 