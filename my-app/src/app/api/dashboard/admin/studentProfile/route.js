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

        // Get student registration details
        const [registrations] = await pool.query(
            `SELECT * FROM registrations WHERE username = ?`,
            [username]
        );

        if (!registrations || registrations.length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'Student not found' 
            }, { status: 404 });
        }

        const student = registrations[0];

        // Get daily submissions
        const [uploads] = await pool.query(
            `SELECT * FROM uploads WHERE username = ?`,
            [username]
        );

        if (uploads && uploads.length > 0) {
            student.uploads = uploads[0];
        }

        // Get verification status
        const [verify] = await pool.query(
            `SELECT * FROM verify WHERE username = ?`,
            [username]
        );

        if (verify && verify.length > 0) {
            student.verify = verify[0];
        }

        // Get attendance
        const [attendance] = await pool.query(
            `SELECT * FROM attendance WHERE username = ?`,
            [username]
        );

        if (attendance && attendance.length > 0) {
            student.attendance = attendance[0];
        }

        // Get final report
        const [final] = await pool.query(
            `SELECT * FROM final WHERE username = ?`,
            [username]
        );

        if (final && final.length > 0) {
            student.final = final[0];
        }

        // Get marks
        const [marks] = await pool.query(
            `SELECT * FROM marks WHERE username = ?`,
            [username]
        );

        if (marks && marks.length > 0) {
            student.marks = marks[0];
        }

        return NextResponse.json({
            success: true,
            student
        });

    } catch (error) {
        console.error('Error in student profile API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
} 