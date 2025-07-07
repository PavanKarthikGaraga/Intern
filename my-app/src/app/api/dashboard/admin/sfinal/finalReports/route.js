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
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only admin can view special student reports.' 
      }, { status: 403 });
    }

    let db;
    try {
      db = await pool.getConnection();

      // Get all sstudents
      const [students] = await db.query(
        `SELECT s.username, r.name, s.mode, s.slot
         FROM sstudents s
         LEFT JOIN registrations r ON s.username = r.username`
      );

      if (!students.length) {
        return NextResponse.json({
          success: true,
          data: { 
            submittedReports: [], 
            pendingReports: [],
            availableSlots: []
          }
        }, { status: 200 });
      }

      // Get unique slots from students
      const availableSlots = [...new Set(students.map(s => Number(s.slot)))].filter(Boolean).sort((a, b) => a - b);

      // Get final reports for these sstudents
      const usernames = students.map(s => s.username);
      let submittedReports = [];
      let pendingReports = [];

      if (usernames.length) {
        // Get all final reports for these sstudents
        const [finalRows] = await db.query(
          `SELECT 
              f.username, 
              f.finalReport, 
              f.finalPresentation, 
              f.completed, 
              r.name, 
              s.mode, 
              s.slot, 
              sdm.internalMarks,
              m.grade,
              m.completed as marksCompleted,
              m.finalReport as finalReportMarks,
              m.finalPresentation as finalPresentationMarks,
              m.totalMarks,
              m.feedback,
              m.updatedAt as evaluatedAt
           FROM final f
           JOIN sstudents s ON f.username = s.username
           LEFT JOIN registrations r ON s.username = r.username
           LEFT JOIN sdailyMarks sdm ON f.username = sdm.username
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
          grade: row.grade,
          finalReportMarks: row.finalReportMarks,
          finalPresentationMarks: row.finalPresentationMarks,
          totalMarks: row.totalMarks,
          feedback: row.feedback,
          evaluatedAt: row.evaluatedAt
        }));

        // Get pending reports
        const [pendingRows] = await db.query(
          `SELECT s.username, r.name, s.mode, s.slot, sdm.internalMarks, m.grade
           FROM sstudents s
           LEFT JOIN final f ON s.username = f.username
           LEFT JOIN registrations r ON s.username = r.username
           LEFT JOIN sdailyMarks sdm ON s.username = sdm.username
           LEFT JOIN marks m ON s.username = m.username
           WHERE s.username IN (${usernames.map(() => '?').join(',')}) AND (f.finalReport IS NULL OR f.finalReport = '')`,
          usernames
        );

        pendingReports = pendingRows.map(row => ({
          username: row.username,
          name: row.name,
          mode: row.mode,
          slot: row.slot,
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
      return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    } finally {
      if (db) await db.release();
    }
  } catch (err) {
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred. Please try again later.' 
    }, { status: 500 });
  }
} 