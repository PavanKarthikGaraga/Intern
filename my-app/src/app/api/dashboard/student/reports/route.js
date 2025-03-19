import getDBConnection from "../../../../../lib/db";

export async function POST(request) {
    let db;
    try {
        db = await getDBConnection();
        const { idNumber, day, link } = await request.json();

        if (!idNumber || !day || !link) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing required fields" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Check if the student already submitted for the given day
        const checkQuery = `SELECT idNumber FROM uploads WHERE idNumber = ? AND dayNumber = ?`;
        const [existing] = await db.execute(checkQuery, [idNumber, day]);

        if (existing.length > 0) {
            return new Response(
                JSON.stringify({ success: false, error: "Report already submitted for this day" }),
                { status: 409, headers: { "Content-Type": "application/json" } }
            );
        }

        // Insert submission record
        const insertQuery = `
            INSERT INTO uploads (idNumber, dayNumber, link, uploadStatus)
            VALUES (?, ?, ?, 'success')
        `;
        await db.execute(insertQuery, [idNumber, day, link]);

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

        // Extract query parameters from the request URL
        const { searchParams } = new URL(request.url);
        const idNumber = searchParams.get('idNumber');

        if (!idNumber) {
            return new Response(
                JSON.stringify({ success: false, error: "Student ID is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const query = `
            SELECT dayNumber, link, uploadStatus, createdAt 
            FROM uploads 
            WHERE idNumber = ? 
            ORDER BY dayNumber ASC
        `;
        const [reports] = await db.execute(query, [idNumber]);

        return new Response(
            JSON.stringify({ 
                success: true, 
                data: reports,
                message: "Reports fetched successfully"
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error fetching reports:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
}
