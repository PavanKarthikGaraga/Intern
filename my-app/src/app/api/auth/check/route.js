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
                // Only delete access token if invalid
                cookieStore.set("accessToken", "", { maxAge: 0 });
                return Response.json({ error: "Invalid token" }, { status: 401 });
            }

            return Response.json(
                {
                    user: {
                        idNumber: decoded.idNumber,
                        name: decoded.name,
                        role: decoded.role
                    },
                },
                { status: 200 }
            );
        } catch (tokenError) {
            if (tokenError.name === "TokenExpiredError") {
                // Only delete access token on expiration
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
                // Only delete access token if invalid
                cookieStore.set("accessToken", "", { maxAge: 0 });

                return Response.json(
                    {
                        error: "Invalid token",
                        code: "INVALID_TOKEN",
                    },
                    { status: 401 }
                );
            }

            throw tokenError;
        }
    } catch (error) {
        console.error("Auth check error:", error);
        return Response.json(
            {
                error: "Internal Server Error",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
