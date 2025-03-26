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

        // Check if the student already has an entry
        const checkQuery = `SELECT idNumber FROM uploads WHERE idNumber = ?`;
        const [existing] = await db.execute(checkQuery, [idNumber]);

        const dayColumn = `day${day}Link`;

        if (existing.length === 0) {
            // Create new record
            const insertQuery = `INSERT INTO uploads (idNumber, ${dayColumn}) VALUES (?, ?)`;
            await db.execute(insertQuery, [idNumber, link]);
        } else {
            // Update existing record
            const updateQuery = `UPDATE uploads SET ${dayColumn} = ? WHERE idNumber = ?`;
            await db.execute(updateQuery, [link, idNumber]);
        }

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
            SELECT 
                idNumber,
                CASE WHEN day1Link IS NOT NULL THEN 1 ELSE NULL END as dayNumber,
                day1Link as link,
                createdAt
            FROM uploads 
            WHERE idNumber = ? AND day1Link IS NOT NULL
            UNION ALL
            SELECT 
                idNumber,
                CASE WHEN day2Link IS NOT NULL THEN 2 ELSE NULL END,
                day2Link,
                createdAt
            FROM uploads 
            WHERE idNumber = ? AND day2Link IS NOT NULL
            UNION ALL
            SELECT 
                idNumber,
                CASE WHEN day3Link IS NOT NULL THEN 3 ELSE NULL END,
                day3Link,
                createdAt
            FROM uploads 
            WHERE idNumber = ? AND day3Link IS NOT NULL
            UNION ALL
            SELECT 
                idNumber,
                CASE WHEN day4Link IS NOT NULL THEN 4 ELSE NULL END,
                day4Link,
                createdAt
            FROM uploads 
            WHERE idNumber = ? AND day4Link IS NOT NULL
            UNION ALL
            SELECT 
                idNumber,
                CASE WHEN day5Link IS NOT NULL THEN 5 ELSE NULL END,
                day5Link,
                createdAt
            FROM uploads 
            WHERE idNumber = ? AND day5Link IS NOT NULL
            UNION ALL
            SELECT 
                idNumber,
                CASE WHEN day6Link IS NOT NULL THEN 6 ELSE NULL END,
                day6Link,
                createdAt
            FROM uploads 
            WHERE idNumber = ? AND day6Link IS NOT NULL
            UNION ALL
            SELECT 
                idNumber,
                CASE WHEN day7Link IS NOT NULL THEN 7 ELSE NULL END,
                day7Link,
                createdAt
            FROM uploads 
            WHERE idNumber = ? AND day7Link IS NOT NULL
            UNION ALL
            SELECT 
                idNumber,
                CASE WHEN day8Link IS NOT NULL THEN 8 ELSE NULL END,
                day8Link,
                createdAt
            FROM uploads 
            WHERE idNumber = ? AND day8Link IS NOT NULL
            ORDER BY dayNumber ASC
        `;
        const [reports] = await db.execute(query, Array(8).fill(idNumber));

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
