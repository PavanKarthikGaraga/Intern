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
            return NextResponse.json({ error: 'Only admin members can create mentors' }, { status: 403 });
        }

        const { idNumber, name, domain } = await request.json();

        // Validate required fields
        if (!idNumber || !name || !domain) {
            return NextResponse.json(
                { success: false, error: "All fields are required" },
                { status: 400 }
            );
        }

        db = await getDBConnection();

        // Start transaction
        await db.beginTransaction();

        try {
            // Update user role to studentMentor
            await db.execute(
                "UPDATE users SET role = 'studentMentor' WHERE idNumber = ?",
                [idNumber]
            );

            // Create entry in studentMentors table
            await db.execute(
                "INSERT INTO studentMentors (mentorId, name, domain) VALUES (?, ?, ?)",
                [idNumber, name, domain]
            );

            // Commit transaction
            await db.commit();

            return NextResponse.json(
                { success: true, message: "Student mentor created successfully" }
            );

        } catch (err) {
            // Rollback transaction on error
            await db.rollback();
            throw err;
        }

    } catch (err) {
        console.error("Error creating student mentor:", err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
} 