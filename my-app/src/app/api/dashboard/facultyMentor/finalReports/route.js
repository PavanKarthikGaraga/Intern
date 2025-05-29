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
    if (!decoded || decoded.role !== 'facultyMentor') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only faculty mentors can view reports.' 
      }, { status: 403 });
    }

    let db;
    try {
      db = await pool.getConnection();

      // Get the faculty mentor's leads
      const [leadRows] = await db.execute(
        'SELECT lead1Id, lead2Id FROM facultyMentors WHERE username = ?',
        [decoded.username]
      );

      if (!leadRows.length) {
        return NextResponse.json({ 
          success: true, 
          data: { 
            submittedReports: [], 
            pendingReports: [],
            availableSlots: [1, 2, 3, 4] // All slots available for faculty mentors
          }
        }, { status: 200 });
      }

      const leadIds = [leadRows[0].lead1Id, leadRows[0].lead2Id].filter(Boolean);

      // Get all students for these leads
      const [students] = await db.execute(
        `SELECT r.username, r.name, r.mode, r.slot, sl.name as studentLeadName, sl.username as studentLeadUsername
         FROM registrations r
         LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
         WHERE r.studentLeadId IN (${leadIds.map(() => '?').join(',')})`,
        leadIds
      );

      if (!students.length) {
        return NextResponse.json({
          success: true,
          data: { 
            submittedReports: [], 
            pendingReports: [],
            availableSlots: [1, 2, 3, 4] // All slots available for faculty mentors
          }
        }, { status: 200 });
      }

      // Get unique slots from students
      const availableSlots = [...new Set(students.map(s => Number(s.slot)))].filter(Boolean).sort((a, b) => a - b);

      // Get final reports for these students
      const usernames = students.map(s => s.username);
      let submittedReports = [];
      let pendingReports = [];

      if (usernames.length) {
        // Get all final reports for these students
        const [finalRows] = await db.query(
          `SELECT 
              f.username, 
              f.finalReport, 
              f.finalPresentation, 
              f.completed, 
              r.name, 
              r.mode, 
              r.slot, 
              dm.internalMarks,
              sl.name as studentLeadName, 
              sl.username as studentLeadUsername,
              m.grade,
              m.completed as marksCompleted,
              m.finalReport as finalReportMarks,
              m.finalPresentation as finalPresentationMarks,
              m.totalMarks,
              m.feedback,
              m.updatedAt as evaluatedAt
           FROM final f
           JOIN registrations r ON f.username = r.username
           LEFT JOIN dailyMarks dm ON f.username = dm.username
           LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
           LEFT JOIN marks m ON f.username = m.username
           WHERE f.username IN (${usernames.map(() => '?').join(',')}) AND f.finalReport IS NOT NULL`,
          usernames
        );

        submittedReports = finalRows.map(row => ({
          username: row.username,
          name: row.name,
          mode: row.mode,
          slot: row.slot,
          finalReport: row.finalReport,
          finalPresentation: row.finalPresentation,
          completed: row.completed,
          marksCompleted: row.marksCompleted,
          internalMarks: row.internalMarks,
          studentLeadName: row.studentLeadName,
          studentLeadUsername: row.studentLeadUsername,
          grade: row.grade,
          finalReportMarks: row.finalReportMarks,
          finalPresentationMarks: row.finalPresentationMarks,
          totalMarks: row.totalMarks,
          feedback: row.feedback,
          evaluatedAt: row.evaluatedAt
        }));

        // Get pending reports
        const [pendingRows] = await db.query(
          `SELECT r.username, r.name, r.mode, r.slot, sl.name as studentLeadName, sl.username as studentLeadUsername, dm.internalMarks, m.grade
           FROM registrations r
           LEFT JOIN final f ON r.username = f.username
           LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
           LEFT JOIN dailyMarks dm ON r.username = dm.username
           LEFT JOIN marks m ON r.username = m.username
           WHERE r.username IN (${usernames.map(() => '?').join(',')}) AND (f.finalReport IS NULL OR f.finalReport = '')`,
          usernames
        );

        pendingReports = pendingRows.map(row => ({
          username: row.username,
          name: row.name,
          mode: row.mode,
          slot: row.slot,
          studentLeadName: row.studentLeadName,
          studentLeadUsername: row.studentLeadUsername,
          internalMarks: row.internalMarks,
          grade: row.grade
        }));
      }

      return NextResponse.json({
        success: true,
        data: { 
          submittedReports, 
          pendingReports,
          availableSlots 
        }
      }, { status: 200 });
    } catch (err) {
      console.error('Error fetching faculty mentor final reports:', err);
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    } finally {
      if (db) await db.release();
    }
  } catch (err) {
    console.error('Error in GET route', err);
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred. Please try again later.' 
    }, { status: 500 });
  }
}

export async function POST(request) {
  const connection = await pool.getConnection();
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
        error: 'Access denied. Only faculty mentors can access this resource.' 
      }, { status: 403 });
    }

    const { username, completed } = await request.json();

    if (!username || typeof completed !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request data. Username and completed status are required.' 
      }, { status: 400 });
    }

    // Check if the student belongs to this faculty mentor
    const [studentCheck] = await connection.query(
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

    // Update completion status
    await connection.query(
      `UPDATE final SET completed = ? WHERE username = ?`,
      [completed, username]
    );

    return NextResponse.json({
      success: true,
      message: `Final report has been ${completed ? 'marked as completed' : 'marked as pending'}.`
    });

  } catch (error) {
    console.error('Error in final reports POST:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
} 