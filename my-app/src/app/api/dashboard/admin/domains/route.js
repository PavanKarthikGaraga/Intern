import { NextResponse } from 'next/server';
import { pool } from '@/config/db';

export async function GET() {
    try {
        // Get unique domains from registrations
        const [result] = await pool.query(`
            SELECT DISTINCT selectedDomain as domain
            FROM registrations
            WHERE selectedDomain IS NOT NULL
            ORDER BY selectedDomain
        `);

        const domains = result.map(row => row.domain);

        return NextResponse.json({
            success: true,
            domains
        });
    } catch (error) {
        console.error('Error fetching domains:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch domains' },
            { status: 500 }
        );
    }
} 