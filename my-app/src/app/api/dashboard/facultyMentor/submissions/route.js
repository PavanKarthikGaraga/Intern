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

        const { username } = decoded.username;

        // Get all verified uploads for students under this faculty mentor
        const [submissions] = await pool.query(
            `SELECT 
                r.username,
                r.name as studentName,
                r.studentLeadId,
                u.day1,
                u.day2,
                u.day3,
                u.day4,
                u.day5,
                u.day6,
                u.day7,
                u.createdAt,
                v.day1 as verified1,
                v.day2 as verified2,
                v.day3 as verified3,
                v.day4 as verified4,
                v.day5 as verified5,
                v.day6 as verified6,
                v.day7 as verified7,
                a.day1 as attendance1,
                a.day2 as attendance2,
                a.day3 as attendance3,
                a.day4 as attendance4,
                a.day5 as attendance5,
                a.day6 as attendance6,
                a.day7 as attendance7
             FROM registrations r
             JOIN studentLeads s ON r.studentLeadId = s.username
             JOIN uploads u ON r.username = u.username
             JOIN verify v ON r.username = v.username
             LEFT JOIN attendance a ON r.username = a.username
             WHERE s.facultyMentorId = ? 
             AND (
                 (u.day1 IS NOT NULL AND v.day1 = TRUE) OR
                 (u.day2 IS NOT NULL AND v.day2 = TRUE) OR
                 (u.day3 IS NOT NULL AND v.day3 = TRUE) OR
                 (u.day4 IS NOT NULL AND v.day4 = TRUE) OR
                 (u.day5 IS NOT NULL AND v.day5 = TRUE) OR
                 (u.day6 IS NOT NULL AND v.day6 = TRUE) OR
                 (u.day7 IS NOT NULL AND v.day7 = TRUE)
             )`,
            [decoded.username]
        );

        return NextResponse.json({ submissions });
    } catch (error) {
        console.error('Error in submissions GET:', error);
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

        const { username, day, attendance } = await req.json();

        // Check if the day is uploaded and verified
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

        // For days after day 1, check if previous day is marked as Present
        if (day > 1) {
            const [previousDay] = await pool.query(
                `SELECT day${day - 1} FROM attendance WHERE username = ?`,
                [username]
            );

            if (!previousDay.length || previousDay[0][`day${day - 1}`] !== 'P') {
                return NextResponse.json(
                    { error: `Cannot mark attendance for Day ${day} until Day ${day - 1} is marked as Present` },
                    { status: 400 }
                );
            }
        }

        // First check if a record exists
        const [existingRecord] = await pool.query(
            'SELECT id FROM attendance WHERE username = ?',
            [username]
        );

        if (existingRecord.length > 0) {
            // Update existing record
            await pool.query(
                `UPDATE attendance SET day${day} = ? WHERE username = ?`,
                [attendance, username]
            );
        } else {
            // Insert new record
            await pool.query(
                `INSERT INTO attendance (username, day${day}) VALUES (?, ?)`,
                [username, attendance]
            );
        }

        return NextResponse.json({ message: 'Attendance updated successfully' });
    } catch (error) {
        console.error('Error in submissions POST:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 