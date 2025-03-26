import getDBConnection from "@/lib/db";

export async function POST(request) {
    let db;
    try {
        const { studentId } = await request.json();

        if (!studentId) {
            return new Response(
                JSON.stringify({ success: false, error: "Student ID is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        db = await getDBConnection();

        // Get all uploads for the student using UNION to combine day links
        const [results] = await db.execute(`
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
        `, [studentId, studentId, studentId, studentId, studentId, studentId, studentId, studentId]);

        // Ensure we always return an array, even if empty
        const uploads = Array.isArray(results) ? results : [];

        return new Response(
            JSON.stringify({
                success: true,
                uploads
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error fetching student uploads:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message, uploads: [] }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
}