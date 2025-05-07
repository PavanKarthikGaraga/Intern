import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(req) {
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

        let decoded;
        try {
            decoded = await verifyAccessToken(accessToken.value);
        } catch (error) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid or expired session. Please login again.' 
            }, { status: 401 });
        }

        if (!decoded || decoded.role !== 'facultyMentor') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only faculty mentors can access this data.' 
            }, { status: 403 });
        }

        const username = decoded.username;
        db = await pool.getConnection();

        // Get students directly from registrations table where facultyMentorId matches
        const [students] = await db.query(
            `SELECT r.*, usr.name, usr.role
             FROM registrations r
             JOIN users usr ON r.username = usr.username
             WHERE r.facultyMentorId = ?`,
            [username]
        );

        if (!students || students.length === 0) {
            return NextResponse.json({
                success: true,
                students: [],
                total: 0,
                message: 'No students assigned yet'
            });
        }

        // Get upload records for each student
        const [uploads] = await db.query(
            `SELECT username, day1, day2, day3, day4, day5, day6, day7, updatedAt
             FROM uploads 
             WHERE username IN (?)`,
            [students.map(s => s.username)]
        );

        // Get verification records for each student
        const [verify] = await db.query(
            `SELECT username, day1, day2, day3, day4, day5, day6, day7
             FROM verify 
             WHERE username IN (?)`,
            [students.map(s => s.username)]
        );

        // Combine the data
        const studentsWithData = students.map(student => {
            const upload = uploads.find(u => u.username === student.username) || {};
            const studentVerify = verify.find(v => v.username === student.username) || {};
            
            return {
                ...student,
                uploads: {
                    day1: upload.day1 || null,
                    day2: upload.day2 || null,
                    day3: upload.day3 || null,
                    day4: upload.day4 || null,
                    day5: upload.day5 || null,
                    day6: upload.day6 || null,
                    day7: upload.day7 || null
                },
                verify: studentVerify
            };
        });

        return NextResponse.json({
            success: true,
            students: studentsWithData,
            total: students.length
        });
    } catch (error) {
        console.error('Error in get students API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    } finally {
        if (db) await db.release();
    }
}

export async function POST(req) {
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
        if (!decoded || decoded.role !== 'facultyMentor') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only faculty mentors can access this data.' 
            }, { status: 403 });
        }

        const { username, day, verified } = await req.json();
        
        if (!username || !day || typeof verified !== 'boolean') {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid request data' 
            }, { status: 400 });
        }

        db = await pool.getConnection();

        // Verify the student is under this faculty mentor's leads
        const [student] = await db.query(
            `SELECT r.username
             FROM registrations r
             JOIN studentLeads sl ON r.studentLeadId = sl.username
             WHERE r.username = ? AND sl.facultyMentorId = ?`,
            [username, decoded.username]
        );

        if (!student || student.length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'Student not found or unauthorized' 
            }, { status: 404 });
        }

        // Update verification status
        await db.query(
            `INSERT INTO verify (username, ${day})
             VALUES (?, ?)
             ON DUPLICATE KEY UPDATE ${day} = ?`,
            [username, verified, verified]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error in students POST:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    } finally {
        if (db) await db.release();
    }
} 