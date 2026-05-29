import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

const verifyStudent = async () => {
    const headersList = await headers();
    const token = headersList.get('authorization')?.split(' ')[1];
    
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
        if (decoded.role !== 'student' && decoded.role !== 'studentLead') return null;
        return decoded;
    } catch {
        return null;
    }
};

export async function GET(req) {
    try {
        const student = await verifyStudent();
        // Allow unauthenticated fetch if we just want it by slot? 
        // Best to require auth since they should have it in dashboard.
        if (!student) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const slot = searchParams.get('slot');

        if (!slot) {
            return NextResponse.json({ error: 'Slot is required' }, { status: 400 });
        }

        const [rows] = await db.query('SELECT deadline FROM reportDeadlines WHERE slot = ?', [slot]);
        
        if (rows.length === 0) {
            // Default fallback if no row
            const defaultDate = Number(slot) === 1 ? '2026-05-29 18:00:00' : '2026-05-30 18:00:00';
            return NextResponse.json({ success: true, data: { deadline: defaultDate } });
        }

        return NextResponse.json({ success: true, data: { deadline: rows[0].deadline } });
    } catch (error) {
        console.error('Error fetching deadline:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
