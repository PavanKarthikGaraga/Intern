import getDBConnection from "@/lib/db";
import { NextResponse } from 'next/server';

export async function GET(request) {
    let db;
    try {
        const { searchParams } = new URL(request.url);
        const mentorId = searchParams.get('mentorId');

        if (!mentorId) {
            return NextResponse.json(
                { success: false, error: 'Mentor ID is required' },
                { status: 400 }
            );
        }

        db = await getDBConnection();

        const [completedStudents] = await db.execute(`
            SELECT 
                cs.studentDetails
            FROM completedStudents cs
            WHERE cs.mentorId = ?
        `, [mentorId]);

        if (completedStudents.length === 0) {
            return NextResponse.json({
                success: true,
                completedStudents: []
            });
        }

        // Transform the JSON object into array format
        const studentDetails = completedStudents[0].studentDetails;
        const parsedStudents = Object.entries(studentDetails).map(([idNumber, details]) => ({
            idNumber,
            ...details
        }));

        return NextResponse.json({
            success: true,
            completedStudents: parsedStudents
        });

    } catch (error) {
        console.error('Error fetching completed students:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
} 