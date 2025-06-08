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

        // Fetch all relevant data
        const [uploads] = await connection.query(
            `SELECT * FROM suploads WHERE username = ?`,
            [username]
        );
        const [attendance] = await connection.query(
            `SELECT * FROM sattendance WHERE username = ?`,
            [username]
        );
        const [messages] = await connection.query(
            `SELECT * FROM smessages WHERE username = ?`,
            [username]
        );
        const [marks] = await connection.query(
            `SELECT * FROM sdailyMarks WHERE username = ?`,
            [username]
        );
        const [status] = await connection.query(
            `SELECT * FROM sstatus WHERE username = ?`,
            [username]
        );

        // Compose per-day data
        const result = [];
        for (let i = 1; i <= 7; i++) {
            result.push({
                day: i,
                report: uploads.length > 0 ? uploads[0][`day${i}`] : null,
                attendance: attendance.length > 0 ? attendance[0][`day${i}`] : null,
                marks: marks.length > 0 ? marks[0][`day${i}`] : null,
                message: messages.length > 0 ? messages[0][`day${i}`] : null,
                status: status.length > 0 ? status[0][`day${i}`] : null,
            });
        }
        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('Error in supplyStudents submissions GET:', error);
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