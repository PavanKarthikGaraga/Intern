import { verifyRefreshToken, generateAuthTokens } from "../../../../lib/jwt";
import { cookies } from 'next/headers';

export async function GET(request) {
    try {
        const cookieStore = await cookies();
        const refreshToken = await cookieStore.get('refreshToken');

        if (!refreshToken) {
            return Response.json({ 
                success: false,
                error: 'No refresh token found' 
            }, { status: 401 });
        }

        const decoded = verifyRefreshToken(refreshToken.value);
        if (!decoded) {
            return Response.json({ 
                success: false,
                error: 'Invalid refresh token' 
            }, { status: 401 });
        }

        const { accessToken } = generateAuthTokens({ 
            idNumber: decoded.idNumber,
            role: decoded.role
        });
            
        cookieStore.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 15
        });

        return Response.json({
            success: true,
            user: {
                idNumber: decoded.idNumber,
                name:decoded.name,
                role: decoded.role
            }
        }, { status: 200 });

    } catch (error) {
        console.error('Refresh error:', error);
        return Response.json({ 
            success: false,
            error: 'Internal Server Error' 
        }, { status: 500 });
    }
}