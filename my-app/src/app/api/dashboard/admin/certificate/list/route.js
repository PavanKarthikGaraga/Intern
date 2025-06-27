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
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only administrators can view certificates.' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const slot = searchParams.get('slot');

    let query = `
      SELECT 
        c.id,
        c.username,
        c.uid,
        c.slot,
        c.totalMarks,
        c.generatedAt,
        r.name,
        r.branch,
        r.year
      FROM certificates c
      JOIN registrations r ON c.username = r.username
      WHERE 1=1
    `;
    const queryParams = [];

    if (slot) {
      query += ' AND c.slot = ?';
      queryParams.push(slot);
    }

    query += ' ORDER BY c.generatedAt DESC';

    const [certificates] = await db.query(query, queryParams);

    return NextResponse.json({
      success: true,
      data: certificates
    });

  } catch (error) {
    console.error('Error fetching certificates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 