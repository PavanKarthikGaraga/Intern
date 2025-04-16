import { NextResponse } from 'next/server';
import { pool } from '@/config/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(request) {
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

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const offset = (page - 1) * limit;

        // Get student leads with pagination and search
        const [studentLeads] = await pool.query(`
            SELECT 
                sl.id,
                sl.username,
                sl.name,
                sl.createdAt,
                sl.updatedAt,
                COUNT(ls.studentId) as assignedStudents
            FROM studentLeads sl
            LEFT JOIN leadStudents ls ON sl.id = ls.studentLeadId
            WHERE sl.name LIKE ? OR sl.username LIKE ?
            GROUP BY sl.id
            ORDER BY sl.id DESC
            LIMIT ? OFFSET ?
        `, [`%${search}%`, `%${search}%`, limit, offset]);

        // Get total count for pagination
        const [total] = await pool.query(`
            SELECT COUNT(*) as total
            FROM studentLeads
            WHERE name LIKE ? OR username LIKE ?
        `, [`%${search}%`, `%${search}%`]);

        return NextResponse.json({
            success: true,
            studentLeads,
            total: total[0].total
        });
    } catch (error) {
        console.error('Error fetching student leads:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch student leads' },
            { status: 500 }
        );
    }
} 