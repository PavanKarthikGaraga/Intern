import { pool } from "../../../../../config/db";

export async function GET(request) {
    let db;
    try {
        db = pool;
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');

        if (!username) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: "Username is required" 
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Get attendance records for the student
        const [attendance] = await db.query(
            `SELECT 
                day1, day2, day3, day4, day5,
                day6, day7, day8, day9, day10
            FROM attendance 
            WHERE username = ?`,
            [username]
        );

        if (attendance.length === 0) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: "No attendance records found" 
                }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // Transform the data into a more usable format
        const attendanceData = attendance[0];
        const formattedAttendance = {};
        
        for (let i = 1; i <= 10; i++) {
            formattedAttendance[`day${i}`] = {
                status: attendanceData[`day${i}`] || null,
                date: new Date(Date.now() - (10 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            };
        }

        return new Response(
            JSON.stringify({
                success: true,
                data: formattedAttendance,
                message: "Attendance records fetched successfully"
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error fetching attendance:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
} 