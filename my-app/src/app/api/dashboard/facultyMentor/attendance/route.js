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

        const { username, day, status, marks } = await req.json();

        // Check if the day is uploaded and verified
        if (status === 'P') {
            const [verifiedUploads] = await pool.query(
                `SELECT 1 FROM uploads u 
                 JOIN verify v ON u.username = v.username 
                 WHERE u.username = ? 
                 AND u.day${day} IS NOT NULL 
                 AND v.day${day} = TRUE`,
                [username]
            );

            if (verifiedUploads.length === 0) {
                return NextResponse.json(
                    { error: 'Cannot mark attendance for unverified or not uploaded day' }, 
                    { status: 400 }
                );
            }
        }

        // For days after day 1, check if previous day is marked as Present
        if (day > 1) {
            const [previousDay] = await pool.query(
                `SELECT day${day - 1} FROM attendance WHERE username = ?`,
                [username]
            );

            if (!previousDay.length || !previousDay[0][`day${day - 1}`]) {
                return NextResponse.json(
                    { error: `Cannot mark attendance for Day ${day} until Day ${day - 1} is marked` },
                    { status: 400 }
                );
            }
        }

        // If it's day 7, check if all 7 days' reports are submitted, and add 1 mark if so
        let finalMarks = marks;
        if (parseInt(day) === 7) {
            const [uploads] = await pool.query(
                `SELECT day1, day2, day3, day4, day5, day6, day7 FROM uploads WHERE username = ?`,
                [username]
            );
            const allSubmitted = uploads.length > 0 && [1,2,3,4,5,6,7].every(d => uploads[0][`day${d}`]);
            if (allSubmitted) {
                finalMarks = (parseFloat(marks) || 0) + 1;
            }
        }

        const connection = await pool.getConnection();
        try {
            await connection.beginTransaction();

            // First check if a record exists
            const [existingRecord] = await connection.query(
                'SELECT id FROM attendance WHERE username = ?',
                [username]
            );

            if (existingRecord.length > 0) {
                // Update existing record
                await connection.query(
                    `UPDATE attendance SET day${day} = ? WHERE username = ?`,
                    [status, username]
                );
            } else {
                // Insert new record
                await connection.query(
                    `INSERT INTO attendance (username, day${day}) VALUES (?, ?)`,
                    [username, status]
                );
            }

            // Update daily marks
            const [existingMarks] = await connection.query(
                'SELECT * FROM dailyMarks WHERE username = ?',
                [username]
            );

            if (existingMarks.length > 0) {
                // First update the specific day's marks
                await connection.query(
                    `UPDATE dailyMarks SET day${day} = ? WHERE username = ?`,
                    [finalMarks, username]
                );

                // Then calculate and update the total internal marks
                const [currentMarks] = await connection.query(
                    `SELECT day1, day2, day3, day4, day5, day6, day7 FROM dailyMarks WHERE username = ?`,
                    [username]
                );

                if (currentMarks.length > 0) {
                    const totalMarks = Object.values(currentMarks[0])
                        .filter(val => typeof val === 'number')
                        .reduce((sum, val) => sum + (val || 0), 0);

                    await connection.query(
                        'UPDATE dailyMarks SET internalMarks = ? WHERE username = ?',
                        [totalMarks, username]
                    );

                    // Update marks table with internal marks
                    const [existingMarksRecord] = await connection.query(
                        'SELECT * FROM marks WHERE username = ?',
                        [username]
                    );

                    if (existingMarksRecord.length > 0) {
                        await connection.query(
                            `UPDATE marks 
                             SET internalMarks = ?,
                                 totalMarks = internalMarks + caseStudyReportMarks + conductParticipationMarks
                             WHERE username = ?`,
                            [totalMarks, username]
                        );
                    } else {
                        // Insert new record in marks table
                        await connection.query(
                            `INSERT INTO marks (username, facultyMentorId, internalMarks, totalMarks)
                             VALUES (?, ?, ?, ?)`,
                            [username, decoded.username, totalMarks, totalMarks]
                        );
                    }
                }
            } else {
                // Insert new marks
                await connection.query(
                    `INSERT INTO dailyMarks (username, day${day}, internalMarks)
                     VALUES (?, ?, ?)`,
                    [username, finalMarks, finalMarks]
                );
            }

            await connection.commit();
            return NextResponse.json({ message: 'Attendance and marks updated successfully' });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in attendance POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}