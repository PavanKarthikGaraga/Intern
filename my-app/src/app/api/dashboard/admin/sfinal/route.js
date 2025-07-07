import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(req) {
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
                error: 'Access denied. Only admin members can access this data.' 
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

        // Get sstudent details
        const [sstudents] = await pool.query(
            `SELECT * FROM sstudents WHERE username = ?`,
            [username]
        );

        if (!sstudents || sstudents.length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'Special student not found' 
            }, { status: 404 });
        }

        const student = sstudents[0];

        // Get daily submissions
        const [uploads] = await pool.query(
            `SELECT * FROM suploads WHERE username = ?`,
            [username]
        );
        if (uploads && uploads.length > 0) {
            student.uploads = uploads[0];
        }

        // Get status
        const [status] = await pool.query(
            `SELECT * FROM sstatus WHERE username = ?`,
            [username]
        );
        if (status && status.length > 0) {
            student.status = status[0];
        }

        // Get attendance
        const [attendance] = await pool.query(
            `SELECT * FROM sattendance WHERE username = ?`,
            [username]
        );
        if (attendance && attendance.length > 0) {
            student.attendance = attendance[0];
        }

        // Get final report (shared table)
        const [final] = await pool.query(
            `SELECT * FROM final WHERE username = ?`,
            [username]
        );
        if (final && final.length > 0) {
            student.final = final[0];
        }

        // Get marks (shared table)
        const [marks] = await pool.query(
            `SELECT * FROM marks WHERE username = ?`,
            [username]
        );
        if (marks && marks.length > 0) {
            student.marks = marks[0];
        }

        // Get daily marks (special)
        const [sdailyMarks] = await pool.query(
            `SELECT * FROM sdailyMarks WHERE username = ?`,
            [username]
        );
        if (sdailyMarks && sdailyMarks.length > 0) {
            student.sdailyMarks = sdailyMarks[0];
        }

        return NextResponse.json({
            success: true,
            student
        });

    } catch (error) {
        console.error('Error in sfinal profile API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
} 