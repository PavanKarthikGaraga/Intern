import getDBConnection from "../../../../../lib/db";

export async function POST(request) {
    let db;
    try {
        db = await getDBConnection();
        const { studentId, day, link } = await request.json();

        if (!studentId || !day || !link) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing required fields" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Check if the student already submitted for the given day
        const checkQuery = `SELECT id FROM uploads WHERE studentId = ? AND dayNumber = ?`;
        const [existing] = await db.execute(checkQuery, [studentId, day]);

        if (existing.length > 0) {
            return new Response(
                JSON.stringify({ success: false, error: "Report already submitted for this day" }),
                { status: 409, headers: { "Content-Type": "application/json" } }
            );
        }

        // Insert submission record
        const insertQuery = `
            INSERT INTO uploads (studentId, dayNumber, link, uploadStatus)
            VALUES (?, ?, ?, 'success')
        `;
        await db.execute(insertQuery, [studentId, day, link]);

        return new Response(
            JSON.stringify({ success: true, message: "Report submitted successfully" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error submitting report", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
}

// GET Route: Fetch all reports submitted by a student
export async function GET(request) {
    let db;
    try {
        db = await getDBConnection();
        const { studentId } = await request.json(); // Get studentId from request body

        if (!studentId) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing student ID" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const query = `
            SELECT dayNumber, link
            FROM uploads
            WHERE studentId = ?
            ORDER BY dayNumber ASC
        `;
        const [rows] = await db.execute(query, [studentId]);

        return new Response(
            JSON.stringify({ success: true, reports: rows }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error fetching student reports", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
}
