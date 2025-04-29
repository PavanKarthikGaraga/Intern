import { verifyAccessToken } from "../../../../lib/jwt";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get("accessToken");

        if (!accessToken?.value) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
            const decoded = await verifyAccessToken(accessToken.value);
            if (!decoded) {
                // Delete invalid token
                cookieStore.set("accessToken", "", { maxAge: 0 });
                return Response.json({ error: "Invalid token" }, { status: 401 });
            }

            return Response.json(
                {
                    user: {
                        username: decoded.username,
                        name: decoded.name,
                        role: decoded.role
                    },
                },
                { status: 200 }
            );
        } catch (tokenError) {
            if (tokenError.name === "TokenExpiredError") {
                cookieStore.set("accessToken", "", { maxAge: 0 });
                return Response.json(
                    {
                        error: "Token expired",
                        code: "TOKEN_EXPIRED",
                    },
                    { status: 401 }
                );
            }

            if (tokenError.name === "JsonWebTokenError") {
                cookieStore.set("accessToken", "", { maxAge: 0 });
                return Response.json(
                    {
                        error: "Invalid token",
                        code: "INVALID_TOKEN",
                    },
                    { status: 401 }
                );
            }

            // For other errors during verification
            return Response.json(
                {
                    error: "Invalid token",
                    code: "INVALID_ACCESS_TOKEN",
                },
                { status: 401 }
            );
        }
    } catch (error) {
        console.error("Auth check error:", error);

        // Special case for our own custom error thrown manually
        if (error.message === "Invalid access token") {
            return Response.json({ error: "Invalid token" }, { status: 401 });
        }

        return Response.json(
            {
                error: "Internal Server Error",
                details: error.message,
            },
            { status: 500 }
        );
    }
}