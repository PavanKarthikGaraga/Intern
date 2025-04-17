import { NextResponse } from 'next/server';
import getDBConnection from "@/lib/db";
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(request) {
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