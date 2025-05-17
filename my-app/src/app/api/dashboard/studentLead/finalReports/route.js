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
        if (!decoded || decoded.role !== 'studentLead') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only student leads can view reports.' 
            }, { status: 403 });
        }

        let db;
        try {
            db = await pool.getConnection();

            // Get the studentLead's slot
            const [leadRows] = await db.execute(
                'SELECT slot FROM studentLeads WHERE username = ?',
                [decoded.username]
            );
            if (!leadRows.length) {
                return NextResponse.json({ success: false, error: 'Student lead not found.' }, { status: 404 });
            }
            const slot = leadRows[0].slot;

            // Determine slots to fetch
            let slotsToFetch = [];
            for (let i = 1; i <= slot; i++) {
                slotsToFetch.push(i);
            }

            // console.log("slotsToFetch",slotsToFetch);

            // Get all students for this lead in the relevant slots
            const [students] = await db.execute(
                `SELECT r.username, r.name, r.mode, r.slot, sl.name as studentLeadName, sl.username as studentLeadUsername
                 FROM registrations r
                 LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
                 WHERE r.studentLeadId = ? AND r.slot IN (${slotsToFetch.map(() => '?').join(',')})`,
                [decoded.username, ...slotsToFetch]
            );
            // console.log("students",students);

            if (!students.length) {
                return NextResponse.json({
                    success: true,
                    data: { submittedReports: [], pendingReports: [] }
                }, { status: 200 });
            }

            // Get final reports for these students
            const usernames = students.map(s => s.username);
            let submittedReports = [];
            let pendingReports = [];
            if (usernames.length) {
                // Get all final reports for these students, join dailyMarks for internalMarks
                const [finalRows] = await db.query(
                    `SELECT f.username, f.finalReport, f.finalPresentation, f.completed, r.name, r.mode, r.slot, dm.internalMarks, sl.name as studentLeadName, sl.username as studentLeadUsername, m.grade
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
                    completed: !!row.completed,
                    internalMarks: row.internalMarks,
                    studentLeadName: row.studentLeadName,
                    studentLeadUsername: row.studentLeadUsername,
                    grade: row.grade
                }));

                // Pending: students who are verified but have not submitted final report
                const [pendingRows] = await db.query(
                    `SELECT r.username, r.name, r.mode, r.slot, sl.name as studentLeadName, sl.username as studentLeadUsername
                     FROM registrations r
                     LEFT JOIN final f ON r.username = f.username
                     LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
                     WHERE r.username IN (${usernames.map(() => '?').join(',')}) AND (f.finalReport IS NULL OR f.finalReport = '')`,
                    usernames
                );
                pendingReports = pendingRows.map(row => ({
                    username: row.username,
                    name: row.name,
                    mode: row.mode,
                    slot: row.slot,
                    studentLeadName: row.studentLeadName,
                    studentLeadUsername: row.studentLeadUsername
                }));
            }

            // console.log("submittedReports",submittedReports);
            // console.log("pendingReports",pendingReports);

            return NextResponse.json({
                success: true,
                data: { submittedReports, pendingReports }
            }, { status: 200 });
        } catch (err) {
            // console.error('Error fetching student lead final reports:', err);
            return NextResponse.json({ success: false, error: err.message }, { status: 500 });
        } finally {
            if (db) await db.release();
        }
    } catch (err) {
        // console.error('Error in GET route', err);
        return NextResponse.json({ 
            success: false, 
            error: 'An error occurred. Please try again later.' 
        }, { status: 500 });
    }
} 