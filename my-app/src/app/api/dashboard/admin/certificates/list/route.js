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
      error: 'Access denied. Only admins can access certificate list.',
    }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 30;
    const search = searchParams.get('search') || '';

    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Build the base query
    let baseQuery = `
      SELECT 
        c.username,
        c.uid,
        c.slot,
        c.totalMarks,
        r.name,
        r.branch,
        r.selectedDomain,
        CASE 
          WHEN c.totalMarks >= 90 THEN 'A'
          WHEN c.totalMarks >= 75 THEN 'B'
          WHEN c.totalMarks >= 60 THEN 'C'
          ELSE 'F'
        END as grade
      FROM certificates c
      LEFT JOIN registrations r ON c.username = r.username
    `;

    let countQuery = `
      SELECT COUNT(*) as total
      FROM certificates c
      LEFT JOIN registrations r ON c.username = r.username
    `;

    let whereClause = '';
    let queryParams = [];

    // Add search functionality
    if (search.trim()) {
      whereClause = `
        WHERE c.username LIKE ? 
        OR c.uid LIKE ? 
        OR r.name LIKE ?
      `;
      const searchPattern = `%${search.trim()}%`;
      queryParams = [searchPattern, searchPattern, searchPattern];
    }

    // Get total count
    const [countResult] = await db.query(countQuery + whereClause, queryParams);
    const totalCertificates = countResult[0].total;

    // Get paginated results
    const finalQuery = baseQuery + whereClause + ' ORDER BY c.username ASC LIMIT ? OFFSET ?';
    const finalParams = [...queryParams, limit, offset];

    const [certificates] = await db.query(finalQuery, finalParams);

    // Calculate total pages
    const totalPages = Math.ceil(totalCertificates / limit);

    return NextResponse.json({
      success: true,
      certificates: certificates,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalCertificates: totalCertificates,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Error fetching certificates list:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 