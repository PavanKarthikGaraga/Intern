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
                    m.finalPresentation,
                    m.finalReport,
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
                    sa.day1, sa.day2, sa.day3, sa.day4, sa.day5, sa.day6, sa.day7,
                    su.day1 as upload1, su.day2 as upload2, su.day3 as upload3, 
                    su.day4 as upload4, su.day5 as upload5, su.day6 as upload6, 
                    su.day7 as upload7,
                    sm.day1 as marks1, sm.day2 as marks2, sm.day3 as marks3,
                    sm.day4 as marks4, sm.day5 as marks5, sm.day6 as marks6,
                    sm.day7 as marks7,
                    msg.day1 as message1, msg.day2 as message2, msg.day3 as message3,
                    msg.day4 as message4, msg.day5 as message5, msg.day6 as message6,
                    msg.day7 as message7
                FROM sstudents s
                LEFT JOIN sdailyMarks sm ON s.username = sm.username
                LEFT JOIN sattendance sa ON s.username = sa.username
                LEFT JOIN suploads su ON s.username = su.username
                LEFT JOIN smessages msg ON s.username = msg.username
                WHERE s.username = ?;
            `;

            const [sstudentRows] = await db.execute(sstudentQuery, [username]);
            const sstudentData = sstudentRows[0] || null;

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
                        totalMarks: sstudentData.finalPresentation + sstudentData.finalReport + sstudentData.sInternalMarks || 0,
                        grade: sstudentData.sGrade || 'Not Qualified',
                        completed: sstudentData.sCompleted
                    },
                    attendance: sstudentAttendance,
                    uploads: sstudentUploads,
                    marks: sstudentMarks,
                    messages: sstudentMessages
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