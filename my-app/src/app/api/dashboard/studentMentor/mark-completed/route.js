import getDBConnection from "@/lib/db";
import { NextResponse } from 'next/server';

export async function POST(request) {
    let db;
    try {
        const { studentId, mentorId } = await request.json();

        if (!studentId || !mentorId) {
            return NextResponse.json(
                { success: false, error: 'Student ID and Mentor ID are required' },
                { status: 400 }
            );
        }

        db = await getDBConnection();

        // Start transaction
        await db.beginTransaction();

        try {
            // Get student details from registrations
            const [studentRows] = await db.execute(
                'SELECT name FROM registrations WHERE idNumber = ?',
                [studentId]
            );

            if (!studentRows.length) {
                throw new Error('Student not found');
            }

            const student = studentRows[0];

            // Get existing completed students for this mentor
            const [existingRows] = await db.execute(
                'SELECT studentDetails FROM completedStudents WHERE mentorId = ?',
                [mentorId]
            );

            let studentDetails = {};
            if (existingRows.length > 0) {
                studentDetails = JSON.parse(existingRows[0].studentDetails);
            }

            // Add new student to the JSON with only required fields
            studentDetails[studentId] = {
                name: student.name,
                domain: student.selectedDomain,
                completionDate: new Date().toISOString()
            };

            // Insert or update in completedStudents table
            if (existingRows.length > 0) {
                await db.execute(
                    'UPDATE completedStudents SET studentDetails = ? WHERE mentorId = ?',
                    [JSON.stringify(studentDetails), mentorId]
                );
            } else {
                await db.execute(
                    'INSERT INTO completedStudents (mentorId, studentDetails) VALUES (?, ?)',
                    [mentorId, JSON.stringify(studentDetails)]
                );
            }

            // Find which position the student is in the mentor's list
            const [mentorRows] = await db.execute(
                'SELECT * FROM studentMentors WHERE mentorId = ?',
                [mentorId]
            );

            const mentor = mentorRows[0];
            let studentPosition = null;

            for (let i = 1; i <= 10; i++) {
                if (mentor[`student${i}Id`] === studentId) {
                    studentPosition = i;
                    break;
                }
            }

            if (!studentPosition) {
                throw new Error('Student not found in mentor\'s list');
            }

            // Remove student from mentor's list
            await db.execute(
                `UPDATE studentMentors SET student${studentPosition}Id = NULL WHERE mentorId = ?`,
                [mentorId]
            );

            // Update registrations table to remove mentor reference
            await db.execute(
                'UPDATE registrations SET studentMentorId = NULL WHERE idNumber = ?',
                [studentId]
            );

            await db.commit();

            return NextResponse.json({
                success: true,
                message: 'Student marked as completed successfully'
            });

        } catch (error) {
            await db.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error marking student as completed:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
} 