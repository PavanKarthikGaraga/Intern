import { pool } from "../../../../../config/db";

export async function GET(request) {
    let db;
    try {
        // No need for getDBConnection() anymore, using pool directly
        db = pool;

        // Extract query parameters from the request URL
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');

        if (!username) {
            return new Response(
                JSON.stringify({ success: false, error: "Student ID is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Build dynamic SQL query with a loop
        const dayQueries = [];
        for (let i = 1; i <= 8; i++) {
            dayQueries.push(`
                SELECT 
                    username,
                    ${i} AS dayNumber,
                    day${i}Link AS link,
                    createdAt
                FROM uploads
                WHERE username = ? AND day${i}Link IS NOT NULL
            `);
        }

        // Combine the queries and append ordering
        const finalQuery = dayQueries.join(" UNION ALL ") + " ORDER BY dayNumber ASC";

        // Prepare parameters (one username for each day)
        const queryParams = Array(8).fill(username);

        // Execute the query using pool.query
        const [reports] = await db.query(finalQuery, queryParams);

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
    }
}

export async function POST(request) {
    let db;
    try {
        db = pool;
        const body = await request.json();
        const { username, dayNumber, link } = body;

        if (!username || !dayNumber || !link) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: "Username, day number, and link are required" 
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Check if the day number is valid (1-10)
        if (dayNumber < 1 || dayNumber > 10) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: "Day number must be between 1 and 10" 
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // First check if a record exists for this username
        const [existingRecord] = await db.query(
            "SELECT * FROM uploads WHERE username = ?",
            [username]
        );

        if (existingRecord.length === 0) {
            // Create a new record
            await db.query(
                `INSERT INTO uploads (username, day${dayNumber}Link) VALUES (?, ?)`,
                [username, link]
            );
        } else {
            // Update existing record
            await db.query(
                `UPDATE uploads SET day${dayNumber}Link = ? WHERE username = ?`,
                [link, username]
            );
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: "Report submitted successfully"
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error submitting report:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
