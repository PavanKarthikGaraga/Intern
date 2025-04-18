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

        // Get unique domains from registrations
        const [domains] = await pool.query(`
            SELECT DISTINCT selectedDomain 
            FROM registrations 
            WHERE selectedDomain IS NOT NULL 
            ORDER BY selectedDomain ASC
        `);

        return NextResponse.json({
            success: true,
            domains: domains.map(row => row.selectedDomain)
        });

    } catch (error) {
        console.error('Error in admin domains API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
} 