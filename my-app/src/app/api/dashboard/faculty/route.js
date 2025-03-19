import getDBConnection from "@/lib/db";

export async function GET(request) {
    let db;
    try {
        db = await getDBConnection();

        const query = `
            SELECT 
                r.*,
                COUNT(u.idNumber) as uploadsCount
            FROM registrations r
            LEFT JOIN uploads u ON r.idNumber = u.idNumber
            GROUP BY r.idNumber
        `;
        const [reports] = await db.execute(query);

        return new Response(
            JSON.stringify(reports),
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

export async function POST(request) {
    let db;
    try {
        db = await getDBConnection();
        const { studentId } = await request.json();

        const query = `
            SELECT *
            FROM uploads
            WHERE idNumber = ?
            ORDER BY dayNumber ASC
        `;
        const [uploads] = await db.execute(query, [studentId]);

        return new Response(
            JSON.stringify(uploads),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error fetching uploads:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
}
