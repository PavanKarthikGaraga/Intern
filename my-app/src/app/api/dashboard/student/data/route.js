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

            // Get reportOpen status first
            const reportOpenQuery = `
                SELECT slot1, slot2, slot3, slot4, slot5, slot6
                FROM reportOpen
                WHERE id = 1;
            `;
            const [reportOpenRows] = await db.execute(reportOpenQuery);
            const reportOpen = reportOpenRows[0] || {
                slot1: false,
                slot2: false,
                slot3: false,
                slot4: false,
                slot5: false,
                slot6: false
            };

            // Query to get student data with mentor and lead information
            const query = `
                SELECT 
                    r.*,
                    u.username,
                    u.name,
                    u.role,
                    sl.name as leadName,
                    sl.username,
                    fm.name as mentorName,
                    fm.username as mentorId,
                    fm.email as mentorEmail
                FROM registrations r
                JOIN users u ON r.username = u.username
                LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
                LEFT JOIN facultyMentors fm ON r.facultyMentorId = fm.username
                WHERE r.username = ?;
            `;

            const [rows] = await db.execute(query, [username]);

            if (rows.length === 0) {
                return NextResponse.json(
                    { success: false, error: "Student not found" },
                    { status: 404 }
                );
            }

            // Get attendance data
            const attendanceQuery = `
                SELECT 
                    day1, day2, day3, day4, day5, day6, day7
                FROM attendance
                WHERE username = ?;
            `;

            const [attendanceRows] = await db.execute(attendanceQuery, [username]);

            // Get uploads data
            const uploadsQuery = `
                SELECT 
                    day1, day2, day3, day4, day5, day6, day7
                FROM uploads
                WHERE username = ?;
            `;

            const [uploadsRows] = await db.execute(uploadsQuery, [username]);

            // Get marks data
            const marksQuery = `
                SELECT 
                    m.internalMarks,
                    m.totalMarks,
                    m.grade,
                    m.completed
                FROM marks m
                WHERE m.username = ?;
            `;

            const [marksRows] = await db.execute(marksQuery, [username]);

            // Check if student is registered in sstudents
            const sstudentQuery = `
                SELECT 
                    s.*,
                    sm.internalMarks as sInternalMarks,
                    sa.day1, sa.day2, sa.day3, sa.day4, sa.day5, sa.day6, sa.day7
                FROM sstudents s
                LEFT JOIN sdailyMarks sm ON s.username = sm.username
                LEFT JOIN sattendance sa ON s.username = sa.username
                WHERE s.username = ?;
            `;

            const [sstudentRows] = await db.execute(sstudentQuery, [username]);
            const sstudentData = sstudentRows[0] || null;

            // Calculate attendance stats
            const attendance = attendanceRows[0] || {};
            const attendanceValues = Object.values(attendance);
            const presentDays = attendanceValues.filter(status => status === 'P').length;
            const totalDays = attendanceValues.filter(status => status !== null).length;

            // Calculate sstudent attendance if exists
            let sstudentAttendance = null;
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
            }

            // Calculate uploads stats
            const uploads = uploadsRows[0] || {};
            const uploadValues = Object.values(uploads);
            const totalUploads = uploadValues.filter(link => link !== null).length;
            const lastUpload = uploadValues.filter(link => link !== null).pop() || null;

            // Combine all data
            const studentData = {
                ...rows[0],
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
                marks: marksRows[0] || {
                    internalMarks: 0,
                    totalMarks: 0,
                    grade: 'Not Qualified',
                    completed: null
                },
                reportOpen,
                sstudentData: sstudentData ? {
                    slot: sstudentData.slot,
                    previousSlot: sstudentData.previousSlot,
                    previousSlotMarks: sstudentData.previousSlotMarks,
                    mode: sstudentData.mode,
                    marks: {
                        internalMarks: sstudentData.sInternalMarks || 0,
                        totalMarks: sstudentData.sTotalMarks || 0,
                        grade: sstudentData.sGrade || 'Not Qualified',
                        completed: sstudentData.sCompleted
                    },
                    attendance: sstudentAttendance
                } : null
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
