import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

export async function POST(req) {
    try {
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken')?.value;

        if (!accessToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 });
        }

        const { useLegacy } = await req.json();
        
        // Set cookie for 24 hours
        (await cookies()).set('use_legacy_db', useLegacy ? 'true' : 'false', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        });

        return NextResponse.json({ 
            success: true, 
            message: `Switched to ${useLegacy ? 'Legacy (2025)' : 'Current (2026)'} database`,
            isLegacy: useLegacy
        });

    } catch (error) {
        console.error('Error toggling database:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const cookieStore = await cookies();
        const isLegacy = cookieStore.get('use_legacy_db')?.value === 'true';
        
        return NextResponse.json({ 
            success: true, 
            isLegacy 
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error fetching DB state' }, { status: 500 });
    }
}
