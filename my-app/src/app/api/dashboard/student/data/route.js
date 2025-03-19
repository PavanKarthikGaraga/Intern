import getDBConnection from "../../../../../lib/db";

export async function POST(request) {
    let db;
    try {
        if (!request.body) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing request body" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await request.json();
        const { idNumber } = body;

        // Enhanced validation
        if (!idNumber) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing idNumber" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Convert to string if number is provided
        const studentId = idNumber.toString();

        // Validate format (assuming student IDs are alphanumeric)
        // if (!/^[A-Za-z0-9]+$/.test(studentId)) {
        //     return new Response(
        //         JSON.stringify({ success: false, error: "Invalid student ID format" }),
        //         { status: 400, headers: { "Content-Type": "application/json" } }
        //     );
        // }

        db = await getDBConnection();
        if (!db) {
            throw new Error("Database connection failed");
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

        const [rows] = await db.execute(query, [studentId]);

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
        console.error("Error fetching student data:", err);
        const errorMessage = err.code === 'ECONNREFUSED' 
            ? "Database connection failed" 
            : "Failed to fetch student data";
        return new Response(
            JSON.stringify({ success: false, error: errorMessage }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) {
            try {
                await db.end();
            } catch (err) {
                console.error("Error closing database connection:", err);
            }
        }
    }
}
