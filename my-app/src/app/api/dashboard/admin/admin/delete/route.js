import { NextResponse } from 'next/server';
import getDBConnection from "@/lib/db";

export async function POST(request) {
    let db;
    try {
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