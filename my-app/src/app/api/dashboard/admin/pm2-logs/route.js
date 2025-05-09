import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

const execAsync = promisify(exec);

export async function GET(request) {
    try {
        // Verify admin authentication
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ 
                success: false, 
                error: 'Authentication required' 
            }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ 
                success: false, 
                error: 'Unauthorized access' 
            }, { status: 403 });
        }

        // Get the number of lines to fetch from query params
        const { searchParams } = new URL(request.url);
        const lines = searchParams.get('lines') || '100';

        // Execute PM2 logs command
        const { stdout, stderr } = await execAsync(`pm2 logs --lines ${lines} --raw`);

        return NextResponse.json({
            success: true,
            logs: stdout || stderr
        });

    } catch (error) {
        console.error('Error fetching PM2 logs:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch PM2 logs'
        }, { status: 500 });
    }
} 