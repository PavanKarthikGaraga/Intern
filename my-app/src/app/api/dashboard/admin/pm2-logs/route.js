import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

// Function to read log files
async function readLogFiles(requestedLines) {
    const logDir = path.join(process.env.HOME || process.env.USERPROFILE, '.pm2', 'logs');
    let allLogs = '';

    try {
        const files = await fs.readdir(logDir);
        const logFiles = files.filter(file => file.endsWith('.log'));
        
        for (const file of logFiles) {
            try {
                const filePath = path.join(logDir, file);
                const content = await fs.readFile(filePath, 'utf8');
                const logLines = content.split('\n').slice(-requestedLines).join('\n');
                allLogs += `\n=== ${file} ===\n${logLines}\n`;
            } catch (error) {
                console.error(`PM2 Logs API: Error reading ${file}:`, error);
            }
        }
    } catch (error) {
        console.error('PM2 Logs API: Error reading log directory:', error);
        allLogs = 'Error reading log files: ' + error.message;
    }

    return allLogs;
}

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
        const requestedLines = parseInt(searchParams.get('lines') || '100');
        const isLive = searchParams.get('live') === 'true';
        console.log('PM2 Logs API: Requested lines:', requestedLines, 'Live:', isLive);

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

        // Get list of PM2 processes using jlist
        console.log('PM2 Logs API: Fetching PM2 process list...');
        const { stdout: listOutput } = await execAsync('pm2 jlist');
        let processes = [];
        try {
            processes = JSON.parse(listOutput);
            console.log('PM2 Logs API: Found processes:', processes.length);
        } catch (error) {
            console.error('PM2 Logs API: Error parsing process list:', error);
            processes = [];
        }

        if (isLive) {
            // Set up SSE response
            const encoder = new TextEncoder();
            const stream = new ReadableStream({
                async start(controller) {
                    // Send initial data
                    const initialLogs = await readLogFiles(requestedLines);
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                        success: true,
                        logs: initialLogs,
                        processes: processes
                    })}\n\n`));

                    // Set up file watchers for each log file
                    const logDir = path.join(process.env.HOME || process.env.USERPROFILE, '.pm2', 'logs');
                    const files = await fs.readdir(logDir);
                    const logFiles = files.filter(file => file.endsWith('.log'));

                    // Keep track of file sizes
                    const fileSizes = new Map();
                    for (const file of logFiles) {
                        const filePath = path.join(logDir, file);
                        const stats = await fs.stat(filePath);
                        fileSizes.set(file, stats.size);
                    }

                    // Check for updates every second
                    const interval = setInterval(async () => {
                        try {
                            let hasUpdates = false;
                            let updatedLogs = '';

                            for (const file of logFiles) {
                                const filePath = path.join(logDir, file);
                                const stats = await fs.stat(filePath);
                                const currentSize = stats.size;
                                const previousSize = fileSizes.get(file) || 0;

                                if (currentSize > previousSize) {
                                    hasUpdates = true;
                                    const content = await fs.readFile(filePath, 'utf8');
                                    const logLines = content.split('\n').slice(-requestedLines).join('\n');
                                    updatedLogs += `\n=== ${file} ===\n${logLines}\n`;
                                    fileSizes.set(file, currentSize);
                                }
                            }

                            if (hasUpdates) {
                                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                                    success: true,
                                    logs: updatedLogs,
                                    processes: processes
                                })}\n\n`));
                            }
                        } catch (error) {
                            console.error('PM2 Logs API: Error in live update:', error);
                        }
                    }, 1000);

                    // Clean up on close
                    request.signal.addEventListener('abort', () => {
                        clearInterval(interval);
                        controller.close();
                    });
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/event-stream',
                    'Cache-Control': 'no-cache',
                    'Connection': 'keep-alive'
                }
            });
        } else {
            // Regular response for non-live requests
            console.log('PM2 Logs API: Reading log files...');
            const allLogs = await readLogFiles(requestedLines);
            console.log('PM2 Logs API: Successfully fetched logs');
            
            return NextResponse.json({
                success: true,
                logs: allLogs || 'No logs available',
                processes: processes
            });
        }

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