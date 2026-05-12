import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        if (!decoded) {
            return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
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
        console.error('Error in student domains API:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
} 
