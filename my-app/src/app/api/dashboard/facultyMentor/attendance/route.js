import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(req) {
    try {
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken')?.value;

        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken);
        if (decoded.role !== 'facultyMentor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const connection = await pool.getConnection();
        try {
            const [attendance] = await connection.query(
                `SELECT a.*, r.name as studentName, r.studentLeadId
                 FROM attendance a
                 JOIN registrations r ON a.username = r.username
                 JOIN studentLeads s ON r.studentLeadId = s.username
                 WHERE s.facultyMentorId = ?`,
                [decoded.username]
            );

            return NextResponse.json({ attendance });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in attendance GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken')?.value;

        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken);
        if (decoded.role !== 'facultyMentor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { username, day, status } = await req.json();

        // Validate day
        if (!(day >= 1 && day <= 7)) {
            return NextResponse.json({ error: 'Invalid day value' }, { status: 400 });
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // Check if attendance record exists
            const [existing] = await connection.query(
                `SELECT 1 FROM attendance WHERE username = ? LIMIT 1`,
                [username]
            );

            if (existing.length === 0) {
                // Insert new attendance record
                await connection.query(
                    `INSERT INTO attendance (username) VALUES (?)`,
                    [username]
                );
            }

            // Update attendance for the given day
            await connection.query(
                `UPDATE attendance SET day${day} = ? WHERE username = ?`,
                [status, username]
            );

            // If day 7, check if all days are 'P' and then complete verification
            if (day === 7) {
                const [attendance] = await connection.query(
                    `SELECT day1, day2, day3, day4, day5, day6, day7
                     FROM attendance WHERE username = ?`,
                    [username]
                );

                if (attendance.length > 0) {
                    const record = attendance[0];
                    const allDaysPresent = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7']
                        .every(d => record[d] === 'P');

                    if (allDaysPresent) {
                        const [student] = await connection.query(
                            `SELECT facultyMentorId FROM registrations WHERE username = ?`,
                            [username]
                        );

                        if (student.length > 0 && student[0].facultyMentorId) {
                            await connection.query(
                                `UPDATE registrations SET verified = true WHERE username = ?`,
                                [username]
                            );

                            const [finalRecord] = await connection.query(
                                `SELECT 1 FROM final WHERE username = ? LIMIT 1`,
                                [username]
                            );

                            if (finalRecord.length === 0) {
                                await connection.query(
                                    `INSERT INTO final (username, facultyMentorId)
                                     VALUES (?, ?)`,
                                    [username, student[0].facultyMentorId]
                                );
                            }
                        }
                    }
                }
            }

            await connection.commit();
            return NextResponse.json({ message: 'Attendance updated successfully' });
        } catch (error) {
            await connection.rollback();
            console.error('Error in attendance POST:', error);
            return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in attendance POST (outer):', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
