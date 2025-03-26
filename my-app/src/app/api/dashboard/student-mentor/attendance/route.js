import getDBConnection from "@/lib/db";

// GET method to fetch attendance
export async function GET(request) {
    let db;
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return new Response(
                JSON.stringify({ success: false, error: "Student ID is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        db = await getDBConnection();
        const [attendance] = await db.execute(
            "SELECT day1, day2, day3, day4, day5, day6, day7, day8 FROM attendance WHERE idNumber = ?",
            [studentId]
        );

        return new Response(
            JSON.stringify({ success: true, data: attendance[0] || {} }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error fetching attendance:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
}

// POST method to mark attendance
export async function POST(request) {
    let db;
    try {
        const { studentId, dayNumber, status } = await request.json();

        if (!studentId || !dayNumber || !status) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: "Student ID, day number, and status are required" 
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        if (!['P', 'A'].includes(status)) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: "Invalid status. Must be 'P' (Present) or 'A' (Absent)" 
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        db = await getDBConnection();

        // Check if attendance record exists
        const [existing] = await db.execute(
            "SELECT * FROM attendance WHERE idNumber = ?",
            [studentId]
        );

        if (existing.length === 0) {
            // Create new attendance record
            await db.execute(
                `INSERT INTO attendance (idNumber, day${dayNumber}) VALUES (?, ?)`,
                [studentId, status]
            );
        } else {
            // Update existing attendance record
            await db.execute(
                `UPDATE attendance SET day${dayNumber} = ? WHERE idNumber = ?`,
                [status, studentId]
            );
        }

        return new Response(
            JSON.stringify({ success: true, message: "Attendance marked successfully" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error marking attendance:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
} 