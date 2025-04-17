import { NextResponse } from 'next/server';
import getDBConnection from "@/lib/db";
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

export async function POST(request) {
    let db;
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

        db = await getDBConnection();
        const { idNumber } = await request.json();

        if (!idNumber) {
            return NextResponse.json(
                { error: 'Admin ID number is required' },
                { status: 400 }
            );
        }

        // Update the user's role to null instead of deleting
        const [result] = await db.execute(
            'DELETE FROM users WHERE idNumber = ? AND role = ?',
            [idNumber, 'admin']
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { error: 'Admin not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: 'Admin role removed successfully' }
        );

    } catch (err) {
        console.error("Error removing admin role:", err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
} 