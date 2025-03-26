import getDBConnection from "@/lib/db";

export async function POST(request) {
    let db;
    try {
        const { studentId, mentorId } = await request.json();

        // Validate required fields
        if (!studentId || !mentorId) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: "Student ID and Mentor ID are required" 
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        db = await getDBConnection();

        // Verify that the mentor exists and is a studentMentor
        const [mentor] = await db.execute(
            "SELECT * FROM studentMentors WHERE mentorId = ?",
            [mentorId]
        );

        if (mentor.length === 0) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: "Invalid mentor ID or mentor not found" 
                }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // Verify that the student exists
        const [student] = await db.execute(
            "SELECT * FROM registrations WHERE idNumber = ?",
            [studentId]
        );

        if (student.length === 0) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: "Student not found" 
                }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // Check if student is already assigned to a mentor
        const [existingAssignment] = await db.execute(`
            SELECT mentorId 
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
        `, [studentId, studentId, studentId, studentId, studentId, studentId, studentId, studentId, studentId, studentId]);

        if (existingAssignment.length > 0) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: "Student is already assigned to a mentor" 
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Find the first available slot in the mentor's student list
        const mentorData = mentor[0];
        let updateQuery = "UPDATE studentMentors SET ";
        let updateParams = [];

        for (let i = 1; i <= 10; i++) {
            const studentField = `student${i}Id`;
            if (!mentorData[studentField]) {
                updateQuery += `${studentField} = ?`;
                updateParams.push(studentId);
                break;
            }
            if (i === 10) {
                return new Response(
                    JSON.stringify({ 
                        success: false, 
                        error: "Mentor has reached maximum student capacity" 
                    }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }
        }

        updateQuery += " WHERE mentorId = ?";
        updateParams.push(mentorId);

        await db.execute(updateQuery, updateParams);

        return new Response(
            JSON.stringify({ 
                success: true, 
                message: "Mentor assigned successfully" 
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error assigning mentor:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
} 