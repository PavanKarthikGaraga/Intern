import { NextResponse } from 'next/server';
import { pool } from '@/config/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(request, { params }) {
    try {
        // Check authentication
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Only admin members can access this resource' }, { status: 403 });
        }

        const leadId = params.leadId;

        // Get students assigned to this lead
        const [students] = await pool.query(`
            SELECT 
                r.username,
                r.name,
                r.selectedDomain,
                r.branch,
                r.year,
                (
                    SELECT COUNT(*) 
                    FROM attendance a 
                    WHERE a.username = r.username AND (a.day1 = 'P' OR a.day2 = 'P' OR a.day3 = 'P' OR 
                          a.day4 = 'P' OR a.day5 = 'P' OR a.day6 = 'P' OR a.day7 = 'P' OR a.day8 = 'P')
                ) as daysCompleted
            FROM registrations r
            INNER JOIN leadStudents ls ON r.id = ls.studentId
            WHERE ls.studentLeadId = ?
            ORDER BY r.name
        `, [leadId]);

        return NextResponse.json({
            success: true,
            students
        });
    } catch (error) {
        console.error('Error fetching assigned students:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch assigned students' },
            { status: 500 }
        );
    }
} 