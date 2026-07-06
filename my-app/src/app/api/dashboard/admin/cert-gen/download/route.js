import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import pool from '@/lib/db';

export async function GET(req) {
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
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ 
          success: false, 
          error: 'Access denied. Only admins can download certificates.' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
        return NextResponse.json({ 
            success: false, 
            error: 'Username is required.' 
        }, { status: 400 });
    }

    const connection = await pool.getConnection();

    try {
        const [certificateRows] = await connection.query(
            'SELECT pdf_data FROM certificates WHERE username = ?',
            [username]
        );

        if (certificateRows.length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'Certificate not found in database.' 
            }, { status: 404 });
        }

        const pdfData = certificateRows[0].pdf_data;
        
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
    console.error('Error in /api/dashboard/admin/cert-gen/download:', error);
    return NextResponse.json({ 
        success: false, 
        error: 'Internal server error' 
    }, { status: 500 });
  }
}
