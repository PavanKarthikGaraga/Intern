import { NextResponse } from 'next/server';
import getDBConnection from '@/lib/db';

export async function POST(request) {
    let db;
    try {
        const { studentId } = await request.json();

        if (!studentId) {
            return NextResponse.json(
                { success: false, error: 'Student ID is required' },
                { status: 400 }
            );
        }

        db = await getDBConnection();

        // Find which mentor has this student
        const [mentorRows] = await db.execute(`
            SELECT mentorId, 
                   CASE 
                       WHEN student1Id = ? THEN 1
                       WHEN student2Id = ? THEN 2
                       WHEN student3Id = ? THEN 3
                       WHEN student4Id = ? THEN 4
                       WHEN student5Id = ? THEN 5
                       WHEN student6Id = ? THEN 6
                       WHEN student7Id = ? THEN 7
                       WHEN student8Id = ? THEN 8
                       WHEN student9Id = ? THEN 9
                       WHEN student10Id = ? THEN 10
                   END as studentPosition
            FROM studentMentors
            WHERE student1Id = ? 
               OR student2Id = ?
               OR student3Id = ?
               OR student4Id = ?
               OR student5Id = ?
               OR student6Id = ?
               OR student7Id = ?
               OR student8Id = ?
               OR student9Id = ?
               OR student10Id = ?
        `, [
            studentId, studentId, studentId, studentId, studentId,
            studentId, studentId, studentId, studentId, studentId,
            studentId, studentId, studentId, studentId, studentId,
            studentId, studentId, studentId, studentId, studentId
        ]);

        if (mentorRows.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Student is not assigned to any mentor' },
                { status: 404 }
            );
        }

        const { mentorId, studentPosition } = mentorRows[0];

        // Update the mentor's record to remove this student
        await db.execute(`
            UPDATE studentMentors 
            SET student${studentPosition}Id = NULL
            WHERE mentorId = ?
        `, [mentorId]);

        return NextResponse.json({
            success: true,
            message: 'Mentor removed successfully'
        });

    } catch (error) {
        console.error('Error removing mentor:', error);
        return NextResponse.json(
            { error: 'Failed to remove mentor' },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
} 