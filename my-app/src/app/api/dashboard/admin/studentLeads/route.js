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

        // Verify that the user is an admin in database
        const userQuery = 'SELECT role FROM users WHERE username = ?';
        const [userRows] = await pool.query(userQuery, [decoded.username]);

        if (!userRows || userRows.length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'User not found in database' 
            }, { status: 404 });
        }

        const userRole = userRows[0].role;

        if (userRole !== 'admin') {
            return NextResponse.json({ 
                success: false, 
                error: `User role is ${userRole}, but admin role is required` 
            }, { status: 403 });
        }

        // Get all student leads with their details
        const [leads] = await pool.query(`
            SELECT 
                sl.username,
                sl.name,
                sl.slot,
                fm.name as facultyMentorName,
                (
                    SELECT COUNT(*)
                    FROM registrations r
                    WHERE r.studentLeadId = sl.username
                ) as totalStudents
            FROM studentLeads sl
            LEFT JOIN facultyMentors fm ON sl.facultyMentorId = fm.username
            ORDER BY sl.name ASC
        `);

        return NextResponse.json({
            success: true,
            leads
        });

    } catch (error) {
        console.error('Error in admin student leads API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
} 