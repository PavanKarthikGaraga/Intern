import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const cookieStore = await cookies();
        
        // Clear both tokens
        cookieStore.delete({ name: 'accessToken', path: '/' });
        cookieStore.delete({ name: 'refreshToken', path: '/' });

        return Response.json({ 
            message: 'Logged out successfully' 
        }, { status: 200 });
    } catch (error) {
        console.error('Logout error:', error);
        return Response.json({ 
            error: 'Failed to logout' 
        }, { status: 500 });
    }
}