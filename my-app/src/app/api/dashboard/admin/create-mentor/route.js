import getDBConnection from "@/lib/db";

export async function POST(request) {
    let db;
    try {
        const { idNumber, name, domain } = await request.json();

        // Validate required fields
        if (!idNumber || !name || !domain) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: "All fields are required" 
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        db = await getDBConnection();

        // Start transaction
        await db.beginTransaction();

        try {
            // Update user role to studentMentor
            await db.execute(
                "UPDATE users SET role = 'studentMentor' WHERE idNumber = ?",
                [idNumber]
            );

            // Create entry in studentMentors table
            await db.execute(
                "INSERT INTO studentMentors (mentorId, name, domain) VALUES (?, ?, ?)",
                [idNumber, name, domain]
            );

            // Commit transaction
            await db.commit();

            return new Response(
                JSON.stringify({ 
                    success: true, 
                    message: "Student mentor created successfully" 
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );

        } catch (err) {
            // Rollback transaction on error
            await db.rollback();
            throw err;
        }

    } catch (err) {
        console.error("Error creating student mentor:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
} 