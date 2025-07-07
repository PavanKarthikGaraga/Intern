import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import pool from '@/lib/db';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ 
                success: false, 
                error: 'Authentication required. Please login again.' 
            }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        if (!decoded) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid token. Please login again.' 
            }, { status: 401 });
        }

        const username = decoded.username;

        // Get connection from pool
        const connection = await pool.getConnection();

        try {
            // Check if problem statement is submitted
            const [problemStatementRows] = await connection.query(
                'SELECT id FROM problemStatements WHERE username = ?',
                [username]
            );

            if (problemStatementRows.length === 0) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Please submit your problem statement before downloading the certificate.' 
                }, { status: 400 });
            }

            // Get certificate data
            const [certificateRows] = await connection.query(
                'SELECT pdf_data FROM certificates WHERE username = ?',
                [username]
            );

            if (certificateRows.length === 0) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Certificate not found.' 
                }, { status: 404 });
            }

            // Convert Buffer to Uint8Array for proper binary handling
            const pdfData = certificateRows[0].pdf_data;
            
            // Create response with PDF data
            return new NextResponse(pdfData, {
                headers: {
                    'Content-Type': 'application/pdf',
                    'Content-Disposition': `attachment; filename=${username}_certificate.pdf`
                }
            });

        } finally {
            connection.release();
        }

    } catch (error) {
        console.error('Error in /api/dashboard/student/certificate/download:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Internal server error' 
        }, { status: 500 });
    }
} 