import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { cookies } from 'next/headers';

const verifyStudent = async () => {
    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('accessToken');

    if (!accessToken?.value) {
        return null;
    }

    const decoded = await verifyAccessToken(accessToken.value);
    if (!decoded || (decoded.role !== 'student' && decoded.role !== 'studentLead')) {
        return null;
    }
    return decoded;
};

export async function GET(req) {
    try {
        const student = await verifyStudent();
        if (!student) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const slot = searchParams.get('slot');

        if (!slot) {
            return NextResponse.json({ error: 'Slot is required' }, { status: 400 });
        }

        const [rows] = await pool.query('SELECT deadline FROM reportDeadlines WHERE slot = ?', [slot]);
        
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
