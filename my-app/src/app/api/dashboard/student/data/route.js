import getDBConnection from "../../../../../lib/db";

export async function POST(request) {
    let db;
    try {
        db = await getDBConnection();
        const { idNumber } = await request.json(); // Extract idNumber from the request body

        if (!idNumber) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing student ID" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const query = `
            SELECT 
                r.idNumber, r.selectedDomain, u.name, 
                r.branch, r.gender, r.year, r.phoneNumber, 
                r.residenceType, r.hostelType
            FROM registrations r
            JOIN users u ON r.idNumber = u.idNumber
            WHERE r.idNumber = ?;
        `;

        const [rows] = await db.execute(query, [idNumber]);

        if (rows.length === 0) {
            return new Response(
                JSON.stringify({ success: false, error: "Student not found" }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, student: rows[0] }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error fetching student data", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
}
