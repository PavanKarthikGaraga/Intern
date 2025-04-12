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
            return NextResponse.json({ error: 'Only admin members can delete students' }, { status: 403 });
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
            // Check if student exists
            const [studentRows] = await db.execute(
                'SELECT * FROM registrations WHERE idNumber = ?',
                [studentId]
            );

            if (studentRows.length === 0) {
                await db.rollback();
                return NextResponse.json(
                    { success: false, error: 'Student not found' },
                    { status: 404 }
                );
            }

            // Check if student is a mentor
            const [mentorRows] = await db.execute(
                'SELECT * FROM studentMentors WHERE mentorId = ?',
                [studentId]
            );

            if (mentorRows.length > 0) {
                await db.rollback();
                return NextResponse.json(
                    { success: false, error: 'Cannot delete a student mentor. Please demote them first.' },
                    { status: 400 }
                );
            }

            // Remove student from studentMentors table if they are assigned to a mentor
            await db.execute(
                `UPDATE studentMentors 
                SET student1Id = CASE WHEN student1Id = ? THEN NULL ELSE student1Id END,
                    student2Id = CASE WHEN student2Id = ? THEN NULL ELSE student2Id END,
                    student3Id = CASE WHEN student3Id = ? THEN NULL ELSE student3Id END,
                    student4Id = CASE WHEN student4Id = ? THEN NULL ELSE student4Id END,
                    student5Id = CASE WHEN student5Id = ? THEN NULL ELSE student5Id END,
                    student6Id = CASE WHEN student6Id = ? THEN NULL ELSE student6Id END,
                    student7Id = CASE WHEN student7Id = ? THEN NULL ELSE student7Id END,
                    student8Id = CASE WHEN student8Id = ? THEN NULL ELSE student8Id END,
                    student9Id = CASE WHEN student9Id = ? THEN NULL ELSE student9Id END,
                    student10Id = CASE WHEN student10Id = ? THEN NULL ELSE student10Id END
                WHERE student1Id = ? OR student2Id = ? OR student3Id = ? OR student4Id = ? 
                OR student5Id = ? OR student6Id = ? OR student7Id = ? OR student8Id = ? 
                OR student9Id = ? OR student10Id = ?`,
                [studentId, studentId, studentId, studentId, studentId, 
                 studentId, studentId, studentId, studentId, studentId,
                 studentId, studentId, studentId, studentId, studentId, 
                 studentId, studentId, studentId, studentId, studentId]
            );

            // Delete from attendance table
            await db.execute(
                'DELETE FROM attendance WHERE idNumber = ?',
                [studentId]
            );

            // Delete from uploads table
            await db.execute(
                'DELETE FROM uploads WHERE idNumber = ?',
                [studentId]
            );

            // Delete from registrations table
            await db.execute(
                'DELETE FROM registrations WHERE idNumber = ?',
                [studentId]
            );

            // Delete from users table
            await db.execute(
                'DELETE FROM users WHERE idNumber = ?',
                [studentId]
            );

            // Commit transaction
            await db.commit();

            return NextResponse.json({
                success: true,
                message: 'Student deleted successfully'
            });

        } catch (error) {
            // Rollback transaction on error
            await db.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error deleting student:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete student' },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
} 