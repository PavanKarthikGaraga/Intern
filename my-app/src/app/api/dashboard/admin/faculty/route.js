import getDBConnection from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET(request) {
    let db;
    try {
        db = await getDBConnection();

        const [faculty] = await db.execute(`
            SELECT idNumber, name
            FROM users
            WHERE role = 'faculty'
            ORDER BY name
        `);

        return new Response(
            JSON.stringify({
                success: true,
                faculty
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error fetching faculty:", err);
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
        const { name, idNumber, password } = await request.json();

        // Validate required fields
        if (!name || !idNumber || !password) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: "All fields are required" 
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Validate email format
        // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        // if (!emailRegex.test(email)) {
        //     return new Response(
        //         JSON.stringify({ 
        //             success: false, 
        //             error: "Invalid email format" 
        //         }),
        //         { status: 400, headers: { "Content-Type": "application/json" } }
        //     );
        // }

        db = await getDBConnection();

        // Check if user already exists
        const [existingUser] = await db.execute(
            "SELECT * FROM users WHERE idNumber = ?",
            [idNumber]
        );

        if (existingUser.length > 0) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: "User with this ID or email already exists" 
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new faculty user
        await db.execute(
            "INSERT INTO users (idNumber, name, password, role) VALUES (?, ?, ?, 'faculty')",
            [idNumber, name, hashedPassword]
        );

        return new Response(
            JSON.stringify({ 
                success: true, 
                message: "Faculty added successfully" 
            }),
            { status: 201, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error adding faculty:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
}

export async function DELETE(request) {
    let db;
    try {
        const { searchParams } = new URL(request.url);
        const idNumber = searchParams.get('idNumber');

        if (!idNumber) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: "Faculty ID is required" 
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        db = await getDBConnection();

        // Check if faculty exists
        const [faculty] = await db.execute(
            "SELECT * FROM users WHERE idNumber = ? AND role = 'faculty'",
            [idNumber]
        );

        if (faculty.length === 0) {
            return new Response(
                JSON.stringify({ 
                    success: false, 
                    error: "Faculty not found" 
                }),
                { status: 404, headers: { "Content-Type": "application/json" } }
            );
        }

        // Delete faculty user
        await db.execute(
            "DELETE FROM users WHERE idNumber = ?",
            [idNumber]
        );

        return new Response(
            JSON.stringify({ 
                success: true, 
                message: "Faculty deleted successfully" 
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error deleting faculty:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
} 