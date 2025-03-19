import getDBConnection from "../../../../../lib/db";

export async function POST(request) {
    let db;
    try {
        db = await getDBConnection();
        const { idNumber }= await request.json();

        if (!idNumber) {
            return new Response(
                JSON.stringify({ success: false, error: "Student ID is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        const query = `
            SELECT dayNumber, link 
            FROM uploads 
            WHERE idNumber = ? 
            ORDER BY dayNumber ASC
        `;
        const [reports] = await db.execute(query, [idNumber]);
        console.log(reports);

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
