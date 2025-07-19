import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import JSZip from 'jszip';

export async function POST(request) {
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
        error: 'Access denied. Only administrators can download certificates.' 
      }, { status: 403 });
    }

    const { usernames } = await request.json();

    if (!usernames || !Array.isArray(usernames) || usernames.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Usernames array is required and must not be empty' 
      }, { status: 400 });
    }

    // Limit the number of certificates to prevent memory issues
    if (usernames.length > 100) {
      return NextResponse.json({ 
        success: false, 
        error: 'Maximum 100 certificates can be downloaded at once' 
      }, { status: 400 });
    }

    // Get certificates from database
    const placeholders = usernames.map(() => '?').join(',');
    const [certificates] = await db.query(
      `SELECT username, pdf_data, uid FROM certificates WHERE username IN (${placeholders})`,
      usernames
    );

    if (certificates.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No certificates found for the provided usernames' 
      }, { status: 404 });
    }

    // Create zip file
    const zip = new JSZip();
    const results = {
      total: usernames.length,
      found: certificates.length,
      missing: usernames.length - certificates.length,
      missingUsernames: []
    };

    // Add found certificates to zip
    certificates.forEach(cert => {
      zip.file(`${cert.username}_certificate.pdf`, cert.pdf_data);
    });

    // Track missing usernames
    const foundUsernames = certificates.map(cert => cert.username);
    results.missingUsernames = usernames.filter(username => !foundUsernames.includes(username));

    // Generate zip file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // Create response with zip file
    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="certificates_${new Date().toISOString().split('T')[0]}.zip"`,
        'X-Results': JSON.stringify(results)
      },
    });

  } catch (error) {
    console.error('Error downloading certificates zip:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 