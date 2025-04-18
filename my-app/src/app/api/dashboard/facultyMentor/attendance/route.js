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
            // Get attendance records for all students under this faculty mentor
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
        const cookieStore = cookies();
        const accessToken = cookieStore.get('accessToken')?.value;
        
        if (!accessToken) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken);
        if (decoded.role !== 'facultyMentor') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { username, day, status } = await req.json();
        const connection = await pool.getConnection();
        try {
            // Update attendance status
            await connection.query(
                `UPDATE attendance SET day${day} = ? WHERE username = ?`,
                [status, username]
            );

            return NextResponse.json({ message: 'Attendance updated successfully' });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in attendance POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 