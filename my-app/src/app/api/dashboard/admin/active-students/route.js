import { NextResponse } from 'next/server';
import { pool } from '@/config/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const offset = (page - 1) * limit;

        // Get active students (where completed = false)
        const [students] = await pool.query(`
            SELECT 
                r.id,
                r.username,
                r.name,
                r.selectedDomain,
                r.branch,
                r.year,
                r.leadId,
                sl.name as leadName,
                (
                    SELECT COUNT(*) 
                    FROM attendance a 
                    WHERE a.username = r.username AND (a.day1 = 'P' OR a.day2 = 'P' OR a.day3 = 'P' OR 
                          a.day4 = 'P' OR a.day5 = 'P' OR a.day6 = 'P' OR a.day7 = 'P' OR a.day8 = 'P')
                ) as daysCompleted
            FROM registrations r
            LEFT JOIN studentLeads sl ON r.leadId = sl.username
            WHERE r.completed = FALSE
            AND (r.name LIKE ? OR r.username LIKE ? OR r.selectedDomain LIKE ?)
            ORDER BY r.id DESC
            LIMIT ? OFFSET ?
        `, [`%${search}%`, `%${search}%`, `%${search}%`, limit, offset]);

        // Get total count for pagination
        const [total] = await pool.query(`
            SELECT COUNT(*) as total
            FROM registrations r
            WHERE r.completed = FALSE
            AND (r.name LIKE ? OR r.username LIKE ? OR r.selectedDomain LIKE ?)
        `, [`%${search}%`, `%${search}%`, `%${search}%`]);

        return NextResponse.json({
            success: true,
            students,
            total: total[0].total
        });
    } catch (error) {
        console.error('Error fetching active students:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch active students' },
            { status: 500 }
        );
    }
} 