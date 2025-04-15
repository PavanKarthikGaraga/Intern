import { verifyAccessToken } from "../../../../lib/jwt";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import getDBConnection from "../../../../lib/db";

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get("accessToken");

        if (!accessToken?.value) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decoded =await verifyAccessToken(accessToken.value);
        if (!decoded) {
            return Response.json({ error: "Invalid token" }, { status: 401 });
        }

        if (!decoded?.idNumber) {
            return Response.json({ error: "Invalid token data" }, { status: 401 });
        }

        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return Response.json({ 
                error: "Current password and new password are required" 
            }, { status: 400 });
        }

        if (currentPassword === newPassword) {
            return Response.json({ 
                error: "New password must be different from current password" 
            }, { status: 400 });
        }

        const db = await getDBConnection();

        try {
            // Get current user's password hash
            const [user] = await db.execute(
                "SELECT password FROM users WHERE idNumber = ?",
                [decoded.idNumber]
            );

            if (!user || user.length === 0) {
                return Response.json({ error: "User not found" }, { status: 404 });
            }

            const isValidPassword = await bcrypt.compare(
                currentPassword,
                user[0].password
            );

            if (!isValidPassword) {
                return Response.json({ 
                    error: "Current password is incorrect" 
                }, { status: 400 });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);

            // Update password
            await db.execute(
                "UPDATE users SET password = ? WHERE idNumber = ?",
                [hashedPassword, decoded.idNumber]
            );

            return Response.json({ 
                message: "Password updated successfully" 
            }, { status: 200 });

        } finally {
            await db.end();
        }

    } catch (error) {
        console.error("Change password error:", error);
        return Response.json(
            {
                error: "Internal Server Error",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
