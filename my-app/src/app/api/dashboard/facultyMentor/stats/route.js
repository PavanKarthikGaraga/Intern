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

        // Get statistics for the faculty mentor's students
        const [stats] = await pool.query(
            `WITH StudentCounts AS (
                SELECT 
                    COUNT(DISTINCT r.username) as total_students,
                    SUM(CASE WHEN v.day1 = true THEN 1 ELSE 0 END +
                        CASE WHEN v.day2 = true THEN 1 ELSE 0 END +
                        CASE WHEN v.day3 = true THEN 1 ELSE 0 END +
                        CASE WHEN v.day4 = true THEN 1 ELSE 0 END +
                        CASE WHEN v.day5 = true THEN 1 ELSE 0 END +
                        CASE WHEN v.day6 = true THEN 1 ELSE 0 END +
                        CASE WHEN v.day7 = true THEN 1 ELSE 0 END) as total_verifications,
                    SUM(CASE WHEN a.day1 IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN a.day2 IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN a.day3 IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN a.day4 IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN a.day5 IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN a.day6 IS NOT NULL THEN 1 ELSE 0 END +
                        CASE WHEN a.day7 IS NOT NULL THEN 1 ELSE 0 END) as total_attendance_marked
                FROM registrations r
                JOIN studentLeads s ON r.studentLeadId = s.username
                LEFT JOIN verify v ON r.username = v.username
                LEFT JOIN attendance a ON r.username = a.username
                WHERE s.facultyMentorId = ?
            )
            SELECT 
                total_students,
                total_verifications,
                total_attendance_marked,
                (total_verifications - total_attendance_marked) as pending_attendance
            FROM StudentCounts`,
            [decoded.username]
        );

        return NextResponse.json({
            totalStudents: stats[0].total_students,
            totalVerifiedReports: stats[0].total_verifications,
            totalAttendancePosted: stats[0].total_attendance_marked,
            pendingAttendance: stats[0].pending_attendance
        });
    } catch (error) {
        console.error('Error in stats GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 