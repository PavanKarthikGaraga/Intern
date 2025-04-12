import { NextResponse } from 'next/server';
import getDBConnection from '@/lib/db';
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
            return NextResponse.json({ error: 'Only admin members can remove mentors' }, { status: 403 });
        }

        const { studentId } = await request.json();

        if (!studentId) {
            return NextResponse.json(
                { success: false, error: 'Student ID is required' },
                { status: 400 }
            );
        }

        db = await getDBConnection();

        // Start transaction
        await db.beginTransaction();

        try {
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
                await db.rollback();
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

            // Update registrations table to remove mentor assignment
            await db.execute(
                'UPDATE registrations SET studentMentorId = NULL WHERE idNumber = ?',
                [studentId]
            );

            await db.commit();
            return NextResponse.json({
                success: true,
                message: 'Mentor removed successfully'
            });

        } catch (error) {
            await db.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error removing mentor:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to remove mentor' },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
} 