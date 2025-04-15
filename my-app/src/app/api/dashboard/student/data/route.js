import { pool } from "../../../../../config/db";

export async function POST(request) {
    try {
        if (!request.body) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing request body" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const body = await request.json();
        const { username } = body;

        // Basic validation
        if (!username) {
            return new Response(
                JSON.stringify({ success: false, error: "Missing username" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const userId = username.toString();

        const query = `
            SELECT 
                * 
            FROM registrations r
            JOIN users u ON r.username = u.username
            WHERE r.username = ?;
        `;

        const [rows] = await pool.query(query, [userId]);

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
    }
}
