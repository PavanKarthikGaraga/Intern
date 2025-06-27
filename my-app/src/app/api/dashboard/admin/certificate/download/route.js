import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(request) {
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

    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    // Allow admin or the student themselves to download
    if (!decoded || (decoded.role !== 'admin' && !(decoded.role === 'student' && decoded.username === username))) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only administrators or the student can download this certificate.' 
      }, { status: 403 });
    }

    if (!username) {
      return NextResponse.json({ 
        success: false, 
        error: 'Username is required' 
      }, { status: 400 });
    }

    // Get certificate from database
    const [certificates] = await db.query(
      'SELECT pdf_data, username FROM certificates WHERE username = ?',
      [username]
    );

    if (certificates.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Certificate not found' 
      }, { status: 404 });
    }

    const certificate = certificates[0];

    return new NextResponse(certificate.pdf_data, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${certificate.username}_certificate.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error downloading certificate:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 