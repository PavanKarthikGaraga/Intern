import { NextResponse } from 'next/server';
import  getDBConnection from '@/lib/db';

export async function POST(request) {
    try {
        const { mentorId } = await request.json();

        if (!mentorId) {
            return NextResponse.json(
                { success: false, error: 'Mentor ID is required' },
                { status: 400 }
            );
        }

        const db = await getDBConnection();

        // Start a transaction
        await db.beginTransaction();

        try {
            // First, set studentMentorId to null in registrations table for all students assigned to this mentor
            await db.query(
                'UPDATE registrations SET studentMentorId = NULL WHERE studentMentorId = ?',
                [mentorId]
            );

            // Then, update the user's role back to student in users table
            await db.query(
                'UPDATE users SET role = "student" WHERE idNumber = ?',
                [mentorId]
            );

            // Finally, delete the mentor record from studentMentors table
            await db.query(
                'DELETE FROM studentMentors WHERE mentorId = ?',
                [mentorId]
            );

            // Commit the transaction
            await db.commit();

            return NextResponse.json({
                success: true,
                message: 'Mentor deleted successfully and demoted to student role'
            });
        } catch (error) {
            // Rollback the transaction in case of error
            await db.rollback();
            throw error;
        } finally {
            await db.end();
        }
    } catch (error) {
        console.error('Error deleting mentor:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete mentor' },
            { status: 500 }
        );
    }
} 