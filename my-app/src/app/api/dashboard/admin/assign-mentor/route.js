import getDBConnection  from '@/lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
    let db;
    try {
        const { studentId, mentorId } = await request.json();

        // Validate required fields
        if (!studentId || !mentorId) {
            return NextResponse.json(
                { success: false, error: 'Student ID and Mentor ID are required' },
                { status: 400 }
            );
        }

        // Prevent self-assignment
        if (studentId === mentorId) {
            return NextResponse.json(
                { success: false, error: 'A student cannot be assigned as their own mentor' },
                { status: 400 }
            );
        }

        db = await getDBConnection();

        // First verify the student exists and get their domain
        const [studentRows] = await db.execute(
            'SELECT selectedDomain, name FROM registrations WHERE idNumber = ?',
            [studentId]
        );

        const student = studentRows[0];
        if (!student) {
            return NextResponse.json(
                { success: false, error: 'Student not found' },
                { status: 404 }
            );
        }

        // Check if mentor exists in studentMentors table
        const [mentorRows] = await db.execute(
            'SELECT * FROM studentMentors WHERE mentorId = ?',
            [mentorId]
        );

        let mentor = mentorRows[0];

        // If mentor doesn't exist, create a new mentor
        if (!mentor) {
            // Get potential mentor's details
            const [potentialMentorRows] = await db.execute(
                'SELECT name, selectedDomain FROM registrations WHERE idNumber = ?',
                [mentorId]
            );
            
            const potentialMentor = potentialMentorRows[0];
            if (!potentialMentor) {
                return NextResponse.json(
                    { success: false, error: 'Potential mentor not found in registrations' },
                    { status: 404 }
                );
            }

            // Start transaction for creating new mentor
            await db.beginTransaction();
            try {
                // Update user role to studentMentor
                await db.execute(
                    "UPDATE users SET role = 'studentMentor' WHERE idNumber = ?",
                    [mentorId]
                );

                // Create entry in studentMentors table
                await db.execute(
                    "INSERT INTO studentMentors (mentorId, name, domain) VALUES (?, ?, ?)",
                    [mentorId, potentialMentor.name, potentialMentor.selectedDomain]
                );

                await db.commit();
                
                // Get the newly created mentor
                const [newMentorRows] = await db.execute(
                    'SELECT * FROM studentMentors WHERE mentorId = ?',
                    [mentorId]
                );
                mentor = newMentorRows[0];
            } catch (error) {
                await db.rollback();
                throw error;
            }
        }

        // Verify domain match
        if (mentor.domain !== student.selectedDomain) {
            return NextResponse.json(
                { success: false, error: 'Mentor domain does not match student domain' },
                { status: 400 }
            );
        }

        // Check if student is already assigned to a mentor by checking both tables
        const [existingMentorRows] = await db.execute(`
            SELECT sm.mentorId 
            FROM studentMentors sm
            WHERE sm.student1Id = ? 
            OR sm.student2Id = ? 
            OR sm.student3Id = ? 
            OR sm.student4Id = ? 
            OR sm.student5Id = ? 
            OR sm.student6Id = ? 
            OR sm.student7Id = ? 
            OR sm.student8Id = ? 
            OR sm.student9Id = ? 
            OR sm.student10Id = ?
        `, [studentId, studentId, studentId, studentId, studentId, studentId, studentId, studentId, studentId, studentId]);

        // Also check registrations table
        const [registrationMentorRows] = await db.execute(
            'SELECT studentMentorId FROM registrations WHERE idNumber = ? AND studentMentorId IS NOT NULL',
            [studentId]
        );

        const existingMentorAssignment = existingMentorRows[0];
        const registrationMentor = registrationMentorRows[0];

        if (existingMentorAssignment || registrationMentor) {
            // If the student is already assigned to this mentor, return success
            if ((existingMentorAssignment?.mentorId === mentorId) || (registrationMentor?.studentMentorId === mentorId)) {
                return NextResponse.json({ success: true });
            }
            return NextResponse.json(
                { success: false, error: 'Student is already assigned to a mentor' },
                { status: 400 }
            );
        }

        // Find the first available slot in the mentor's student list
        let updateQuery = "UPDATE studentMentors SET ";
        let updateParams = [];

        for (let i = 1; i <= 10; i++) {
            const studentField = `student${i}Id`;
            if (!mentor[studentField]) {
                updateQuery += `${studentField} = ?`;
                updateParams.push(studentId);
                break;
            }
            if (i === 10) {
                return NextResponse.json(
                    { success: false, error: 'Mentor has reached maximum student capacity' },
                    { status: 400 }
                );
            }
        }

        updateQuery += " WHERE mentorId = ?";
        updateParams.push(mentorId);

        // Start a transaction to update both tables
        await db.beginTransaction();
        try {
            // Update studentMentors table
            await db.execute(updateQuery, updateParams);
            
            // Update registrations table
            await db.execute(
                'UPDATE registrations SET studentMentorId = ? WHERE idNumber = ?',
                [mentorId, studentId]
            );

            await db.commit();
            return NextResponse.json({ success: true });
        } catch (error) {
            await db.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error assigning mentor:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to assign mentor' },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
} 