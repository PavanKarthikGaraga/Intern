import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

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
                error: 'Access denied. Only students can access this data.' 
            }, { status: 403 });
        }

        if (!request.body) {
            return NextResponse.json(
                { success: false, error: "Missing request body" },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { username } = body;

        if (!username || username !== decoded.username) {
            return NextResponse.json(
                { success: false, error: "Missing username" },
                { status: 400 }
            );
        }

        let db;
        try {
            db = await pool.getConnection();
            if (!db) {
                throw new Error("Database connection failed");
            }

            // Get reportOpen status first with a safe fallback
            let reportOpen = {
                slot1: false, slot2: false, slot3: false, slot4: false, slot5: false,
                slot6: false, slot7: false, slot8: false, slot9: false
            };
            try {
                const reportOpenQuery = `SELECT * FROM reportOpen WHERE id = 1;`;
                const [reportOpenRows] = await db.execute(reportOpenQuery);
                if (reportOpenRows.length > 0) {
                    reportOpen = { ...reportOpen, ...reportOpenRows[0] };
                }
            } catch (err) {
                console.warn('Warning: Could not fetch reportOpen, using defaults.');
            }

            // Query to get student data with mentor and lead information
            let rows = [];
            try {
                const query = `
                    SELECT 
                        r.*,
                        u.username,
                        u.name,
                        u.role,
                        sl.name as leadName,
                        sl.username as leadUsername,
                        fm.name as mentorName,
                        fm.username as mentorId,
                        fm.email as mentorEmail
                    FROM registrations r
                    JOIN users u ON r.username = u.username
                    LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
                    LEFT JOIN facultyMentors fm ON r.facultyMentorId = fm.username
                    WHERE r.username = ?;
                `;
                [rows] = await db.execute(query, [username]);
            } catch (err) {
                // Fallback for unmigrated legacy databases (missing studentLeadId/facultyMentorId)
                if (err.code === 'ER_BAD_FIELD_ERROR' || err.message.includes('Unknown column')) {
                    const fallbackQuery = `
                        SELECT 
                            r.*,
                            u.username,
                            u.name,
                            u.role
                        FROM registrations r
                        JOIN users u ON r.username = u.username
                        WHERE r.username = ?;
                    `;
                    [rows] = await db.execute(fallbackQuery, [username]);
                } else {
                    throw err;
                }
            }

            if (rows.length === 0) {
                return NextResponse.json(
                    { success: false, error: "Student not found" },
                    { status: 404 }
                );
            }

            // Get slotControl enabled status for this student's slot
            let slotEnabled = false;
            try {
                const [slotControlRows] = await db.execute(
                    'SELECT enabled FROM slotControl WHERE slot = ?',
                    [rows[0].slot]
                );
                slotEnabled = slotControlRows[0]?.enabled === 1;
            } catch (e) { console.warn('slotControl table not found, defaulting to false.'); }

            // Get attendance data (safe fallback if table missing)
            let attendanceRows = [[]];
            try {
                [attendanceRows] = await db.execute(
                    'SELECT day1, day2, day3, day4, day5, day6, day7 FROM attendance WHERE username = ?',
                    [username]
                );
            } catch (e) { console.warn('attendance table missing or error:', e.message); }

            // Get uploads data (safe fallback if table missing)
            let uploadsRows = [[]];
            try {
                [uploadsRows] = await db.execute(
                    'SELECT day1, day2, day3, day4, day5, day6, day7 FROM uploads WHERE username = ?',
                    [username]
                );
            } catch (e) { console.warn('uploads table missing or error:', e.message); }

            // Get marks data (safe fallback if table missing)
            let marksRows = [[]];
            try {
                [marksRows] = await db.execute(
                    'SELECT m.internalMarks, m.finalPresentation, m.finalReport, m.grade, m.completed FROM marks m WHERE m.username = ?',
                    [username]
                );
            } catch (e) { console.warn('marks table missing or error:', e.message); }

            // Get admin-evaluated daily task marks (safe fallback)
            let dailyMarksRow = null;
            try {
                const [dmRows] = await db.execute(
                    'SELECT day1, day2, day3, day4, day5, day6, day7 FROM dailyMarks WHERE username = ?',
                    [username]
                );
                dailyMarksRow = dmRows[0] || null;
            } catch (e) { console.warn('dailyMarks table missing or error:', e.message); }

            // Check if student is registered in sstudents (safe fallback if table missing)
            let sstudentRows = [[]];
            try {
                [sstudentRows] = await db.execute(
                    `SELECT s.*, sm.internalMarks as sInternalMarks,
                        sa.day1, sa.day2, sa.day3, sa.day4, sa.day5, sa.day6, sa.day7,
                        su.day1 as upload1, su.day2 as upload2, su.day3 as upload3,
                        su.day4 as upload4, su.day5 as upload5, su.day6 as upload6, su.day7 as upload7,
                        sm.day1 as marks1, sm.day2 as marks2, sm.day3 as marks3,
                        sm.day4 as marks4, sm.day5 as marks5, sm.day6 as marks6, sm.day7 as marks7,
                        msg.day1 as message1, msg.day2 as message2, msg.day3 as message3,
                        msg.day4 as message4, msg.day5 as message5, msg.day6 as message6, msg.day7 as message7
                    FROM sstudents s
                    LEFT JOIN sdailyMarks sm ON s.username = sm.username
                    LEFT JOIN sattendance sa ON s.username = sa.username
                    LEFT JOIN suploads su ON s.username = su.username
                    LEFT JOIN smessages msg ON s.username = msg.username
                    WHERE s.username = ?`,
                    [username]
                );
            } catch (e) { console.warn('sstudents table missing or error:', e.message); }
            const sstudentData = sstudentRows[0] || null;

            // Fetch sstudent marks from marks table if sstudentData exists
            let sstudentMarksRow = null;
            if (sstudentData) {
                try {
                    const [sstudentMarksRows] = await db.execute(
                        'SELECT internalMarks, finalReport, finalPresentation, grade, completed FROM marks WHERE username = ?',
                        [sstudentData.username]
                    );
                    sstudentMarksRow = sstudentMarksRows[0] || null;
                } catch (e) { console.warn('marks lookup for sstudent failed:', e.message); }
            }

            // Add supply field based on sstudentData
            const supply = sstudentData ? true : false;

            // Calculate attendance stats
            const attendance = attendanceRows[0] || {};
            const attendanceValues = Object.values(attendance);
            const presentDays = attendanceValues.filter(status => status === 'P').length;
            const totalDays = attendanceValues.filter(status => status !== null).length;

            // Calculate sstudent attendance if exists
            let sstudentAttendance = null;
            let sstudentUploads = null;
            let sstudentMarks = null;
            let sstudentMessages = null;

            if (sstudentData) {
                const sAttendanceValues = Object.values({
                    day1: sstudentData.day1,
                    day2: sstudentData.day2,
                    day3: sstudentData.day3,
                    day4: sstudentData.day4,
                    day5: sstudentData.day5,
                    day6: sstudentData.day6,
                    day7: sstudentData.day7
                });

                sstudentAttendance = {
                    totalDays: sAttendanceValues.filter(status => status !== null).length,
                    presentDays: sAttendanceValues.filter(status => status === 'P').length,
                    details: {
                        day1: sstudentData.day1,
                        day2: sstudentData.day2,
                        day3: sstudentData.day3,
                        day4: sstudentData.day4,
                        day5: sstudentData.day5,
                        day6: sstudentData.day6,
                        day7: sstudentData.day7
                    }
                };

                sstudentUploads = {
                    details: {
                        day1: sstudentData.upload1,
                        day2: sstudentData.upload2,
                        day3: sstudentData.upload3,
                        day4: sstudentData.upload4,
                        day5: sstudentData.upload5,
                        day6: sstudentData.upload6,
                        day7: sstudentData.upload7
                    }
                };

                sstudentMarks = {
                    details: {
                        day1: sstudentData.marks1,
                        day2: sstudentData.marks2,
                        day3: sstudentData.marks3,
                        day4: sstudentData.marks4,
                        day5: sstudentData.marks5,
                        day6: sstudentData.marks6,
                        day7: sstudentData.marks7
                    }
                };

                sstudentMessages = {
                    details: {
                        day1: sstudentData.message1,
                        day2: sstudentData.message2,
                        day3: sstudentData.message3,
                        day4: sstudentData.message4,
                        day5: sstudentData.message5,
                        day6: sstudentData.message6,
                        day7: sstudentData.message7
                    }
                };
            }

            // Calculate uploads stats
            const uploads = uploadsRows[0] || {};
            const uploadValues = Object.values(uploads);
            const totalUploads = uploadValues.filter(link => link !== null).length;
            const lastUpload = uploadValues.filter(link => link !== null).pop() || null;

            // Fetch student's problem statement (safe fallback if table missing)
            let problemStatementData = null;
            try {
                const [problemStatementRows] = await db.query('SELECT * FROM problemStatements WHERE username = ?', [username]);
                problemStatementData = problemStatementRows[0] || null;
            } catch (e) { console.warn('problemStatements table missing or error:', e.message); }

            // Fetch student's certificate (safe fallback if table missing)
            let certificate = null;
            try {
                const [certificateRows] = await db.query('SELECT uid FROM certificates WHERE username = ?', [username]);
                certificate = certificateRows[0] || null;
            } catch (e) { console.warn('certificates table missing or error:', e.message); }

            // Combine all data
            const studentData = {
                ...rows[0],
                supply,
                attendance: {
                    totalDays,
                    presentDays,
                    absentDays: totalDays - presentDays,
                    details: attendance
                },
                uploads: {
                    totalUploads,
                    lastUpload,
                    details: uploads
                },
                marks: {
                    ...marksRows[0],
                    totalMarks: Number(marksRows[0]?.internalMarks || 0) + 
                               Number(marksRows[0]?.finalReport || 0) + 
                               Number(marksRows[0]?.finalPresentation || 0),
                    internalMarks: marksRows[0]?.internalMarks || 0,
                    grade: marksRows[0]?.grade || 'Not Qualified',
                    completed: marksRows[0]?.completed || null
                } || {
                    internalMarks: 0,
                    totalMarks: 0,
                    grade: 'Not Qualified',
                    completed: null
                },
                reportOpen,
                problemStatementData,
                sstudentData: sstudentData ? {
                    slot: sstudentData.slot,
                    previousSlot: sstudentData.previousSlot,
                    previousSlotMarks: sstudentData.previousSlotMarks,
                    mode: sstudentData.mode,
                    marks: sstudentMarksRow ? {
                        internalMarks: sstudentMarksRow.internalMarks || 0,
                        finalReport: sstudentMarksRow.finalReport || 0,
                        finalPresentation: sstudentMarksRow.finalPresentation || 0,
                        totalMarks: sstudentMarksRow.totalMarks || 0,
                        grade: sstudentMarksRow.grade || 'Not Qualified',
                        completed: sstudentMarksRow.completed || null
                    } : {
                        internalMarks: sstudentData.sInternalMarks || 0,
                        finalReport: 0,
                        finalPresentation: 0,
                        totalMarks: sstudentData.sInternalMarks || 0,
                        grade: 'Not Qualified',
                        completed: null
                    },
                    attendance: sstudentAttendance,
                    uploads: sstudentUploads,
                    marks: sstudentMarks,
                    messages: sstudentMessages
                } : null,
                certificate: certificate ? { exists: true, uid: certificate.uid } : { exists: false },
                slotEnabled,
                dailyMarks: dailyMarksRow ? {
                    d1: dailyMarksRow.day1 === null ? null : Number(dailyMarksRow.day1),
                    d2: dailyMarksRow.day2 === null ? null : Number(dailyMarksRow.day2),
                    d3: dailyMarksRow.day3 === null ? null : Number(dailyMarksRow.day3),
                    d4: dailyMarksRow.day4 === null ? null : Number(dailyMarksRow.day4),
                    d5: dailyMarksRow.day5 === null ? null : Number(dailyMarksRow.day5),
                    d6: dailyMarksRow.day6 === null ? null : Number(dailyMarksRow.day6),
                    d7: dailyMarksRow.day7 === null ? null : Number(dailyMarksRow.day7),
                    total: [1,2,3,4,5,6,7].reduce((s, i) => s + (Number(dailyMarksRow[`day${i}`]) || 0), 0),
                } : null,
            };

            return NextResponse.json({
                success: true,
                student: studentData
            });

        } catch (error) {
            console.error('Error in student data endpoint:', error);
            return NextResponse.json(
                { success: false, error: error.message },
                { status: 500 }
            );
        } finally {
            if (db) await db.release();
        }
    } catch (error) {
        console.error('Error in student data endpoint:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function GET() {
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
        if (!decoded) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid token. Please login again.' 
            }, { status: 401 });
        }

        const username = decoded.username;

        // Get connection from pool
        const connection = await pool.getConnection();

        try {
            // Check certificate existence (safe fallback if table missing in legacy DB)
            let hasCertificate = false;
            let certificateUid = null;
            try {
                const [certificateRows] = await connection.query(
                    'SELECT uid FROM certificates WHERE username = ?', [username]
                );
                hasCertificate = certificateRows.length > 0;
                certificateUid = hasCertificate ? certificateRows[0].uid : null;
            } catch (e) { console.warn('certificates table missing:', e.message); }

            // Check problem statement submission (safe fallback if table missing in legacy DB)
            let hasProblemStatement = false;
            try {
                const [problemStatementRows] = await connection.query(
                    'SELECT id FROM problemStatements WHERE username = ?', [username]
                );
                hasProblemStatement = problemStatementRows.length > 0;
            } catch (e) { console.warn('problemStatements table missing:', e.message); }

            return NextResponse.json({
                success: true,
                data: { hasCertificate, hasProblemStatement, certificateUid }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error in /api/dashboard/student/data:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Internal server error' 
        }, { status: 500 });
    }
}