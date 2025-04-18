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
            // Get faculty mentor's basic info
            const [facultyInfo] = await connection.query(
                `SELECT f.*, u.name as facultyName, u.role
                 FROM facultyMentors f 
                 JOIN users u ON f.username = u.username 
                 WHERE f.username = ?`,
                [decoded.username]
            );

            return NextResponse.json({
                username: facultyInfo[0].username,
                name: facultyInfo[0].facultyName,
                role: facultyInfo[0].role,
                // domain: facultyInfo[0].domain
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in profile GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 