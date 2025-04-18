import { verifyAccessToken } from "../../../../lib/jwt";
import pool from "../../../../lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
    let db;
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return Response.json({ 
                success: false,
                message: "Token and password are required" 
            }, { status: 400 });
        }

        // Verify the reset token
        const decoded = await verifyAccessToken(token);
        if (!decoded || decoded.type !== 'password_reset') {
            return Response.json({ 
                success: false,
                message: "Invalid or expired reset token" 
            }, { status: 400 });
        }

        db = await pool.getConnection();

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Update the user's password
        const [result] = await db.execute(
            "UPDATE users SET password = ? WHERE username = ?",
            [hashedPassword, decoded.username]
        );

        if (result.affectedRows === 0) {
            return Response.json({ 
                success: false,
                message: "User not found" 
            }, { status: 404 });
        }

        return Response.json({ 
            success: true,
            message: "Password reset successful" 
        });

    } catch (error) {
        console.error("Password reset error:", error);
        return Response.json({ 
            success: false,
            message: "Failed to reset password" 
        }, { status: 500 });
    } finally {
        if (db) await db.release();
    }
} 