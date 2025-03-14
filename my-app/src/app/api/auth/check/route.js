import { verifyAccessToken } from "../../../../lib/jwt";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = cookies();
        const accessToken = cookieStore.get('accessToken');

        if (!accessToken) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        try {
            const decoded = verifyAccessToken(accessToken.value);
            if (!decoded) {
                cookies().delete('accessToken');
                cookies().delete('refreshToken');
                return Response.json({ error: 'Invalid token' }, { status: 401 });
            }

            return Response.json({
                user: {
                    username: decoded.username
                }
            }, { status: 200 });

        } catch (tokenError) {
            // Handle specific token verification errors
            if (tokenError.name === 'TokenExpiredError') {
                cookies().delete('accessToken');
                return Response.json({ 
                    error: 'Token expired',
                    code: 'TOKEN_EXPIRED'
                }, { status: 401 });
            }
            
            if (tokenError.name === 'JsonWebTokenError') {
                cookies().delete('accessToken');
                cookies().delete('refreshToken');
                return Response.json({ 
                    error: 'Invalid token',
                    code: 'INVALID_TOKEN'
                }, { status: 401 });
            }

            throw tokenError;
        }
    } catch (error) {
        console.log('Auth check error:', error);
        return Response.json({ 
            error: 'Internal Server Error',
            details: error.message 
        }, { status: 500 });
    }
}