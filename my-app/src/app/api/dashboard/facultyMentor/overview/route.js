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
            // Get faculty mentor's basic info
            const [facultyInfo] = await connection.query(
                `SELECT f.*, u.name as facultyName 
                 FROM facultyMentors f 
                 JOIN users u ON f.username = u.username 
                 WHERE f.username = ?`,
                [decoded.username]
            );

            // Get assigned leads count
            const [leadsCount] = await connection.query(
                `SELECT COUNT(*) as count 
                 FROM studentLeads 
                 WHERE facultyMentorId = ?`,
                [decoded.username]
            );

            // Get total students count
            const [studentsCount] = await connection.query(
                `SELECT COUNT(*) as count 
                 FROM registrations r 
                 JOIN studentLeads s ON r.studentLeadId = s.username 
                 WHERE s.facultyMentorId = ?`,
                [decoded.username]
            );

            // Get completed students count
            const [completedCount] = await connection.query(
                `SELECT COUNT(*) as count 
                 FROM completedStudents 
                 WHERE mentorId = ?`,
                [decoded.username]
            );

            // Get total verified reports
            const [totalVerified] = await connection.query(
                `SELECT COUNT(*) as count
                 FROM verify v
                 JOIN registrations r ON v.username = r.username
                 JOIN studentLeads s ON r.studentLeadId = s.username
                 WHERE s.facultyMentorId = ?
                 AND (v.day1 = TRUE OR v.day2 = TRUE OR v.day3 = TRUE OR 
                      v.day4 = TRUE OR v.day5 = TRUE OR v.day6 = TRUE OR v.day7 = TRUE)`,
                [decoded.username]
            );

            // Get total attendance posted
            const [totalAttendance] = await connection.query(
                `SELECT COUNT(*) as count
                 FROM attendance a
                 JOIN registrations r ON a.username = r.username
                 JOIN studentLeads s ON r.studentLeadId = s.username
                 WHERE s.facultyMentorId = ?
                 AND (a.day1 IS NOT NULL OR a.day2 IS NOT NULL OR a.day3 IS NOT NULL OR 
                      a.day4 IS NOT NULL OR a.day5 IS NOT NULL OR a.day6 IS NOT NULL OR a.day7 IS NOT NULL)`,
                [decoded.username]
            );

            // Get total possible attendance (students * 7 days)
            const totalPossibleAttendance = studentsCount[0].count * 7;

            return NextResponse.json({
                facultyInfo,
                leadsCount: leadsCount[0].count,
                studentsCount: studentsCount[0].count,
                completedCount: completedCount[0].count,
                totalVerified: totalVerified[0].count,
                totalAttendance: totalAttendance[0].count,
                totalPendingAttendance: totalPossibleAttendance - totalAttendance[0].count
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in overview GET:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
} 