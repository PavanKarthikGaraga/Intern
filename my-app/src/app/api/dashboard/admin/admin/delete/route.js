import getDBConnection from "@/lib/db";

export async function POST(request) {
    let db;
    try {
        db = await getDBConnection();
        const { idNumber } = await request.json();

        if (!idNumber) {
            return new Response(
                JSON.stringify({ error: 'Admin ID number is required' }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Update the user's role to null instead of deleting
        const [result] = await db.execute(
            'DELETE FROM users WHERE idNumber = ? AND role = ?',
            [idNumber, 'admin']
        );

        if (result.affectedRows === 0) {
            return new Response(
                JSON.stringify({ error: 'Admin not found' }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Admin role removed successfully' }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error removing admin role:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
} 