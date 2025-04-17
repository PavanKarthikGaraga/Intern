import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(req) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('accessToken')?.value;
        
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken);
        if (decoded.role !== 'facultyMentor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const connection = await pool.getConnection();
        try {
            // Get all students under the faculty mentor's leads
            const [students] = await connection.query(
                `SELECT DISTINCT
                    r.username,
                    r.name,
                    r.selectedDomain as domain,
                    r.mode,
                    r.slot,
                    r.studentLeadId,
                    sl.name as leadName,
                    u.day1,
                    u.day2,
                    u.day3,
                    u.day4,
                    u.day5,
                    u.day6,
                    u.day7,
                    v.day1 as verified1,
                    v.day2 as verified2,
                    v.day3 as verified3,
                    v.day4 as verified4,
                    v.day5 as verified5,
                    v.day6 as verified6,
                    v.day7 as verified7
                FROM registrations r
                JOIN studentLeads sl ON r.studentLeadId = sl.username
                LEFT JOIN uploads u ON r.username = u.username
                LEFT JOIN verify v ON r.username = v.username
                WHERE sl.facultyMentorId = ?
                ORDER BY r.name`,
                [decoded.username]
            );

            // Format the response
            const formattedStudents = students.map(student => ({
                username: student.username,
                name: student.name,
                domain: student.domain,
                mode: student.mode,
                slot: student.slot,
                leadName: student.leadName,
                submissions: {
                    day1: student.day1,
                    day2: student.day2,
                    day3: student.day3,
                    day4: student.day4,
                    day5: student.day5,
                    day6: student.day6,
                    day7: student.day7
                },
                verified: {
                    day1: student.verified1,
                    day2: student.verified2,
                    day3: student.verified3,
                    day4: student.verified4,
                    day5: student.verified5,
                    day6: student.verified6,
                    day7: student.verified7
                }
            }));

            return NextResponse.json(formattedStudents);
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in students GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const cookieStore = await cookies();
        const accessToken = cookieStore.get('accessToken')?.value;
        
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken);
        if (decoded.role !== 'facultyMentor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { username, day, verified } = await req.json();
        
        if (!username || !day || typeof verified !== 'boolean') {
            return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            // Verify the student is under this faculty mentor's leads
            const [student] = await connection.query(
                `SELECT r.username
                 FROM registrations r
                 JOIN studentLeads sl ON r.studentLeadId = sl.username
                 WHERE r.username = ? AND sl.facultyMentorId = ?`,
                [username, decoded.username]
            );

            if (student.length === 0) {
                return NextResponse.json({ error: 'Student not found or unauthorized' }, { status: 404 });
            }

            // Update verification status
            await connection.query(
                `INSERT INTO verify (username, ${day})
                 VALUES (?, ?)
                 ON DUPLICATE KEY UPDATE ${day} = ?`,
                [username, verified, verified]
            );

            return NextResponse.json({ success: true });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in students POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 