import getDBConnection from "@/lib/db";
import { NextResponse } from 'next/server';

export async function POST(request) {
    let db;
    try {
        const { mentorId } = await request.json();

        if (!mentorId) {
            return NextResponse.json(
                { success: false, error: "Mentor ID is required" },
                { status: 400 }
            );
        }

        db = await getDBConnection();

        // Start transaction
        await db.beginTransaction();

        try {
            // Check if mentor exists
            const [mentorRows] = await db.execute(
                'SELECT * FROM studentMentors WHERE mentorId = ?',
                [mentorId]
            );

            if (!mentorRows.length) {
                throw new Error("Mentor not found");
            }

            const mentor = mentorRows[0];
            let availableSlots = [];

            // Find empty slots in mentor
            for (let i = 1; i <= 10; i++) {
                const studentField = `student${i}Id`;
                if (!mentor[studentField]) {
                    availableSlots.push(i);
                }
            }

            if (availableSlots.length === 0) {
                throw new Error("Mentor has reached maximum student capacity");
            }

            // Fetch students matching criteria
            const [availableStudents] = await db.execute(
                `SELECT r.*, 
                    (SELECT COUNT(*) FROM uploads u WHERE u.idNumber = r.idNumber) AS daysCompleted
                FROM registrations r
                WHERE r.selectedDomain = ?
                AND r.completed = FALSE
                AND r.studentMentorId IS NULL
                AND r.idNumber NOT IN (
                    SELECT idNumber FROM users WHERE role = 'studentMentor'
                )
                ORDER BY r.createdAt ASC
                LIMIT ${availableSlots.length}`,
                [mentor.domain]
            );

            if (availableStudents.length === 0) {
                throw new Error("No matching students found");
            }

            // Assign students to mentor
            for (let i = 0; i < availableStudents.length; i++) {
                const student = availableStudents[i];
                const slotNumber = availableSlots[i];
                const studentField = `student${slotNumber}Id`;

                // Update studentMentors table
                await db.execute(
                    `UPDATE studentMentors SET ${studentField} = ? WHERE mentorId = ?`,
                    [student.idNumber, mentorId]
                );

                // Update registrations table
                await db.execute(
                    'UPDATE registrations SET studentMentorId = ? WHERE idNumber = ?',
                    [mentorId, student.idNumber]
                );
            }

            await db.commit();
            return NextResponse.json({ 
                success: true,
                assignedStudents: availableStudents
            });

        } catch (error) {
            await db.rollback();
            throw error;
        }

    } catch (err) {
        console.error("Error assigning students to mentor:", err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
}