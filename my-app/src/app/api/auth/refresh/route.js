import { verifyRefreshToken, generateAccessToken } from "../../../../lib/jwt";
import { cookies } from "next/headers";

export async function POST() {
    try {
        const cookieStore = await cookies();
        const refreshToken = await cookieStore.get("refreshToken");

        if (!refreshToken) {
            return Response.json({ success: false, error: "No refresh token found" }, { status: 401 });
        }

        const decoded = await verifyRefreshToken(refreshToken.value);
        if (!decoded) {
            return Response.json({ success: false, error: "Invalid refresh token" }, { status: 401 });
        }

        const accessToken = await generateAccessToken({
            username: decoded.username,
            role: decoded.role,
            name: decoded.name,
        });

        cookieStore.set("accessToken", accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 600, // 10 min
        });

        return Response.json({
            success: true,
            user: {
                username: decoded.username,
                name: decoded.name,
                role: decoded.role,
            },
        });
    } catch (error) {
        console.error("Refresh error:", error);
        return Response.json({ success: false, error: "Internal Server Error" }, { status: 500 });
    }
}