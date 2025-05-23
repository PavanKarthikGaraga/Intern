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

            // Calculate attendance stats
            const attendance = attendanceRows[0] || {};
            const attendanceValues = Object.values(attendance);
            const presentDays = attendanceValues.filter(status => status === 'P').length;
            const totalDays = attendanceValues.filter(status => status !== null).length;

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
                }
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
