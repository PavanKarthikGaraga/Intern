import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(request) {
    let db;
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
                error: 'Access denied. Only student leads can access this data.' 
            }, { status: 403 });
        }

        const { username } = await request.json();

        if (!username) {
            return NextResponse.json(
                { success: false, error: "Missing username" },
                { status: 400 }
            );
        }

        db = await pool.getConnection();

        // Get all students assigned to this lead
        const [students] = await db.query(
            `SELECT r.*, u.name, u.role
             FROM registrations r
             JOIN users u ON r.username = u.username
             WHERE r.studentLeadId = ?`,
            [username]
        );

        if (students.length === 0) {
            return NextResponse.json({
                success: true,
                students: [],
                total: 0
            });
        }

        const studentUsernames = students.map(s => s.username);

        // Get upload records for each student
        const [uploads] = await db.query(
            `SELECT username, day1, day2, day3, day4, day5, day6, day7
             FROM uploads 
             WHERE username IN (?)`,
            [studentUsernames]
        );

        // Get verification records for each student
        const [verify] = await db.query(
            `SELECT username, day1, day2, day3, day4, day5, day6, day7
             FROM verify 
             WHERE username IN (?)`,
            [studentUsernames]
        );

        // Combine the data
        const studentsWithData = students.map(student => {
            const studentUploads = uploads.find(u => u.username === student.username) || {};
            const studentVerify = verify.find(v => v.username === student.username) || {};
            
            return {
                ...student,
                uploads: studentUploads,
                verify: studentVerify
            };
        });

        return NextResponse.json({
            success: true,
            students: studentsWithData,
            total: students.length
        });

    } catch (error) {
        console.error('Error fetching students:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    } finally {
        if (db) await db.release();
    }
} 