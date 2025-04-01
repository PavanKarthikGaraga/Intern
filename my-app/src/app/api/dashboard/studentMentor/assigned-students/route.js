import getDBConnection from "@/lib/db";

export async function GET(request) {
    let db;
    try {
        const { searchParams } = new URL(request.url);
        const mentorId = searchParams.get('mentorId');

        if (!mentorId) {
            return new Response(
                JSON.stringify({ success: false, error: "Mentor ID is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        db = await getDBConnection();

        // Get all students assigned to this mentor
        const [students] = await db.execute(`
            SELECT r.*, 
                   COALESCE(a.day1, '') as day1,
                   COALESCE(a.day2, '') as day2,
                   COALESCE(a.day3, '') as day3,
                   COALESCE(a.day4, '') as day4,
                   COALESCE(a.day5, '') as day5,
                   COALESCE(a.day6, '') as day6,
                   COALESCE(a.day7, '') as day7,
                   COALESCE(a.day8, '') as day8
            FROM registrations r
            LEFT JOIN attendance a ON r.idNumber = a.idNumber
            WHERE r.idNumber IN (
                SELECT student1Id FROM studentMentors WHERE mentorId = ?
                UNION
                SELECT student2Id FROM studentMentors WHERE mentorId = ?
                UNION
                SELECT student3Id FROM studentMentors WHERE mentorId = ?
                UNION
                SELECT student4Id FROM studentMentors WHERE mentorId = ?
                UNION
                SELECT student5Id FROM studentMentors WHERE mentorId = ?
                UNION
                SELECT student6Id FROM studentMentors WHERE mentorId = ?
                UNION
                SELECT student7Id FROM studentMentors WHERE mentorId = ?
                UNION
                SELECT student8Id FROM studentMentors WHERE mentorId = ?
                UNION
                SELECT student9Id FROM studentMentors WHERE mentorId = ?
                UNION
                SELECT student10Id FROM studentMentors WHERE mentorId = ?
            )
            ORDER BY r.name
        `, [mentorId, mentorId, mentorId, mentorId, mentorId, mentorId, mentorId, mentorId, mentorId, mentorId]);

        // Transform the attendance data into a more usable format
        const transformedStudents = students.map(student => {
            const attendance = {
                day1: student.day1,
                day2: student.day2,
                day3: student.day3,
                day4: student.day4,
                day5: student.day5,
                day6: student.day6,
                day7: student.day7,
                day8: student.day8
            };

            // Remove attendance fields from the student object
            delete student.day1;
            delete student.day2;
            delete student.day3;
            delete student.day4;
            delete student.day5;
            delete student.day6;
            delete student.day7;
            delete student.day8;

            return {
                ...student,
                attendance
            };
        });

        return new Response(
            JSON.stringify({
                success: true,
                students: transformedStudents
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error fetching assigned students:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
} 