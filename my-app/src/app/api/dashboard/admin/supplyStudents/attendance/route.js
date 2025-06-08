import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(req) {
    const connection = await pool.getConnection();
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
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only administrators can access this data.' 
            }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json({ 
                success: false, 
                error: 'Username is required' 
            }, { status: 400 });
        }

        // Get attendance data
        const [attendance] = await connection.query(
            `SELECT * FROM sattendance WHERE username = ?`,
            [username]
        );

        return NextResponse.json({
            success: true,
            attendance: attendance || []
        });

    } catch (error) {
        console.error('Error in supplyStudents attendance GET:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Internal server error' 
            },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

export async function POST(req) {
    const connection = await pool.getConnection();
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
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only administrators can update attendance.' 
            }, { status: 403 });
        }

        const { username, day, status, marks = 0, remarks = '', resetStatus = false } = await req.json();

        if (!username || !day || !status) {
            return NextResponse.json(
                { success: false, message: 'Invalid request parameters' },
                { status: 400 }
            );
        }

        // Validate status
        if (!['P', 'A', 'S'].includes(status)) {
            return NextResponse.json(
                { success: false, message: 'Invalid attendance status' },
                { status: 400 }
            );
        }

        await connection.beginTransaction();
        try {
            // Attendance
            const [existingAttendance] = await connection.query(
                `SELECT * FROM sattendance WHERE username = ?`,
                [username]
            );
            if (existingAttendance.length === 0) {
                await connection.query(
                    `INSERT INTO sattendance (username, day${day}) VALUES (?, ?)`,
                    [username, status]
                );
            } else {
                await connection.query(
                    `UPDATE sattendance SET day${day} = ? WHERE username = ?`,
                    [status, username]
                );
            }

            // Marks (only if present)
            if (status === 'P') {
                const [existingMarks] = await connection.query(
                    `SELECT * FROM sdailyMarks WHERE username = ?`,
                    [username]
                );
                if (existingMarks.length === 0) {
                    await connection.query(
                        `INSERT INTO sdailyMarks (username, day${day}) VALUES (?, ?)`,
                        [username, marks]
                    );
                } else {
                    await connection.query(
                        `UPDATE sdailyMarks SET day${day} = ? WHERE username = ?`,
                        [marks, username]
                    );
                }
                // Calculate and update internal marks
                const [allMarks] = await connection.query(
                    `SELECT day1, day2, day3, day4, day5, day6, day7 FROM sdailyMarks WHERE username = ?`,
                    [username]
                );
                if (allMarks.length > 0) {
                    const marksObj = allMarks[0];
                    let totalMarks = 0;
                    for (let i = 1; i <= 7; i++) {
                        totalMarks += parseFloat(marksObj[`day${i}`] || 0);
                    }
                    await connection.query(
                        `UPDATE sdailyMarks SET internalMarks = ? WHERE username = ?`,
                        [totalMarks, username]
                    );
                }
            }

            // Remarks/messages
            const [existingMsg] = await connection.query(
                `SELECT * FROM smessages WHERE username = ?`,
                [username]
            );
            if (existingMsg.length === 0) {
                const msgFields = Array(7).fill(null);
                msgFields[day - 1] = remarks;
                await connection.query(
                    `INSERT INTO smessages (username, day1, day2, day3, day4, day5, day6, day7) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [username, ...msgFields]
                );
            } else {
                await connection.query(
                    `UPDATE smessages SET day${day} = ? WHERE username = ?`,
                    [remarks, username]
                );
            }

            // Reset sstatus for this day if requested
            if (resetStatus) {
                const [existingStatus] = await connection.query(
                    `SELECT * FROM sstatus WHERE username = ?`,
                    [username]
                );
                if (existingStatus.length === 0) {
                    const statusFields = Array(7).fill(null);
                    await connection.query(
                        `INSERT INTO sstatus (username, day${day}) VALUES (?, NULL)`,
                        [username]
                    );
                } else {
                    await connection.query(
                        `UPDATE sstatus SET day${day} = NULL WHERE username = ?`,
                        [username]
                    );
                }
            }

            await connection.commit();
            return NextResponse.json({ success: true });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error updating attendance:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
} 