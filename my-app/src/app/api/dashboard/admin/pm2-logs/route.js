import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

const execAsync = promisify(exec);

export async function GET(request) {
    console.log('PM2 Logs API: Request received');
    try {
        // Verify admin authentication
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');
        console.log('PM2 Logs API: Access token present:', !!accessToken?.value);

        if (!accessToken?.value) {
            console.log('PM2 Logs API: No access token found');
            return NextResponse.json({ 
                success: false, 
                error: 'Authentication required' 
            }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        console.log('PM2 Logs API: Token decoded, role:', decoded?.role);

        if (!decoded || decoded.role !== 'admin') {
            console.log('PM2 Logs API: Unauthorized access attempt');
            return NextResponse.json({ 
                success: false, 
                error: 'Unauthorized access' 
            }, { status: 403 });
        }

        // Get the number of lines to fetch from query params
        const { searchParams } = new URL(request.url);
        const lines = searchParams.get('lines') || '100';
        console.log('PM2 Logs API: Requested lines:', lines);

        // First check if PM2 is installed and running
        console.log('PM2 Logs API: Checking PM2 availability...');
        try {
            await execAsync('pm2 ping');
            console.log('PM2 Logs API: PM2 is running');
        } catch (error) {
            console.error('PM2 Logs API: PM2 not available:', error.message);
            return NextResponse.json({
                success: false,
                error: 'PM2 is not running or not installed'
            }, { status: 500 });
        }

        // Get list of PM2 processes
        console.log('PM2 Logs API: Fetching PM2 process list...');
        const { stdout: listOutput } = await execAsync('pm2 list --format json');
        const processes = JSON.parse(listOutput);
        console.log('PM2 Logs API: Found processes:', processes.length);

        // Execute PM2 logs command with timeout
        console.log('PM2 Logs API: Fetching logs...');
        const { stdout, stderr } = await execAsync(`pm2 logs --lines ${lines} --raw`, {
            timeout: 5000 // 5 second timeout
        });

        if (stderr) {
            console.error('PM2 Logs API: Error output:', stderr);
        }

        console.log('PM2 Logs API: Successfully fetched logs');
        return NextResponse.json({
            success: true,
            logs: stdout || stderr || 'No logs available',
            processes: processes
        });

    } catch (error) {
        console.error('PM2 Logs API: Error:', error);
        console.error('PM2 Logs API: Error stack:', error.stack);
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to fetch PM2 logs',
            details: error.stack
        }, { status: 500 });
    }
} 