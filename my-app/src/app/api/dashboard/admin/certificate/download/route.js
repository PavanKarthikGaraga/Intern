import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import db from '@/lib/db';

export async function GET(request) {
  const cookieStore = await cookies();
  const accessToken = await cookieStore.get('accessToken');

  if (!accessToken?.value) {
    return NextResponse.json({
      success: false,
      error: 'Authentication required. Please login again.',
    }, { status: 401 });
  }

  const decoded = await verifyAccessToken(accessToken.value);
  if (!decoded || decoded.role !== 'admin') {
    return NextResponse.json({
      success: false,
      error: 'Access denied. Only admins can download certificates.',
    }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({
        success: false,
        error: 'Username is required.',
      }, { status: 400 });
    }

    // Fetch certificate PDF data from database
    const [certificateRows] = await db.query(
      'SELECT pdf_data, username FROM certificates WHERE username = ?',
      [username]
    );

    if (certificateRows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Certificate not found for this username.',
      }, { status: 404 });
    }

    const certificate = certificateRows[0];
    const pdfBuffer = certificate.pdf_data;

    if (!pdfBuffer) {
      return NextResponse.json({
        success: false,
        error: 'Certificate PDF data is missing.',
      }, { status: 404 });
    }

    // Return the PDF as a downloadable file
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${username}_certificate.pdf"`,
        'Cache-Control': 'no-cache',
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