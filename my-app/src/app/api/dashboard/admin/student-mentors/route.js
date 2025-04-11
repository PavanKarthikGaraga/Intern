import { NextResponse } from 'next/server';
import getDBConnection from "@/lib/db";

export async function GET(request) {
    let db;
    try {
        db = await getDBConnection();

        const [mentors] = await db.execute(`
            SELECT 
                sm.mentorId,
                sm.name,
                sm.domain,
                COUNT(DISTINCT r.idNumber) as assignedStudents
            FROM studentMentors sm
            JOIN users u ON sm.mentorId = u.idNumber AND u.role = 'studentMentor'
            LEFT JOIN registrations r ON 
                r.idNumber IN (
                    sm.student1Id, sm.student2Id, sm.student3Id,
                    sm.student4Id, sm.student5Id, sm.student6Id,
                    sm.student7Id, sm.student8Id, sm.student9Id,
                    sm.student10Id
                )
                AND NOT EXISTS (
                    SELECT 1 FROM users u2 
                    WHERE u2.idNumber = r.idNumber 
                    AND u2.role = 'studentMentor'
                )
            GROUP BY sm.mentorId, sm.name, sm.domain
            ORDER BY sm.name
        `);

        return NextResponse.json({
            success: true,
            mentors
        });

    } catch (err) {
        console.error("Error fetching student mentors:", err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
} 