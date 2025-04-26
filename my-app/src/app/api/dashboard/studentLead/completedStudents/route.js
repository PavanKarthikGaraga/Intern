import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

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
    if (!decoded || decoded.role !== 'studentLead') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only student leads can view completed students.' 
      }, { status: 403 });
    }

    const body = await request.json();
    if (!body || !body.username) {
      return NextResponse.json({ 
        success: false, 
        error: 'Username is required.' 
      }, { status: 400 });
    }

    const { username, page = 1, limit = 10, slot } = body;
    const offset = (page - 1) * limit;

    const db = await pool.getConnection();
    try {
      // Base query conditions
      const baseConditions = ['r.studentLeadId = ?'];
      const queryParams = [username];

      // Add slot filter if provided
      if (slot) {
        baseConditions.push('r.slot = ?');
        queryParams.push(slot);
      }

      const conditions = baseConditions.join(' AND ');

      // Get verified students (7/7 attendance and in final table)
      const [verifiedStudents] = await db.query(
        `SELECT r.*, u.name as studentName, f.completed as finalCompleted
         FROM registrations r 
         JOIN users u ON r.username = u.username 
         LEFT JOIN final f ON r.username = f.username
         WHERE ${conditions} AND r.verified = true
         LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      // Get total count of verified students
      const [verifiedCount] = await db.query(
        `SELECT COUNT(*) as total
         FROM registrations r
         WHERE ${conditions} AND r.verified = true`,
        queryParams
      );

      // Get failed students (not verified or not in final table)
      const [failedStudents] = await db.query(
        `SELECT r.*, u.name as studentName
         FROM registrations r
         JOIN users u ON r.username = u.username
         LEFT JOIN final f ON r.username = f.username
         WHERE ${conditions} 
           AND r.verified = false
           AND f.username IS NULL
         LIMIT ? OFFSET ?`,
        [...queryParams, limit, offset]
      );

      // Get total count of failed students
      const [failedCount] = await db.query(
        `SELECT COUNT(*) as total
         FROM registrations r
         LEFT JOIN final f ON r.username = f.username
         WHERE ${conditions} 
           AND r.verified = false
           AND f.username IS NULL`,
        queryParams
      );

      return NextResponse.json({ 
        success: true,
        verifiedStudents,
        failedStudents,
        pagination: {
          verifiedTotal: verifiedCount[0]?.total || 0,
          failedTotal: failedCount[0]?.total || 0,
          currentPage: page,
          totalPages: {
            verified: Math.ceil((verifiedCount[0]?.total || 0) / limit),
            failed: Math.ceil((failedCount[0]?.total || 0) / limit)
          }
        }
      });
    } finally {
      db.release();
    }
  } catch (error) {
    console.error('Error fetching completed students:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 