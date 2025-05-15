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

    const { 
      username, 
      completedPage = 1, 
      pendingPage = 1, 
      limit = 10, 
      slot 
    } = body;

    const completedOffset = Math.max(0, (completedPage - 1) * limit);
    const pendingOffset = Math.max(0, (pendingPage - 1) * limit);

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

      // Get completed students (completed = true in final table)
      const [completedStudents] = await db.query(
        `SELECT r.*, u.name as studentName, f.finalReport, f.finalPresentation, m.grade, m.totalMarks
         FROM registrations r
         JOIN users u ON r.username = u.username
         JOIN final f ON r.username = f.username
         LEFT JOIN marks m ON r.username = m.username
         WHERE ${conditions} 
           AND f.completed = true
         ORDER BY r.name ASC
         LIMIT ? OFFSET ?`,
        [...queryParams, limit, completedOffset]
      );

      // Get pending students (completed = false or not in final table)
      const [pendingStudents] = await db.query(
        `SELECT r.*, u.name as studentName, f.finalReport, f.finalPresentation
         FROM registrations r
         JOIN users u ON r.username = u.username
         LEFT JOIN final f ON r.username = f.username
         WHERE ${conditions} 
           AND (f.completed = false OR f.username IS NULL)
         ORDER BY r.name ASC
         LIMIT ? OFFSET ?`,
        [...queryParams, limit, pendingOffset]
      );

      // Get total count of completed students
      const [completedCount] = await db.query(
        `SELECT COUNT(*) as total
         FROM registrations r
         JOIN final f ON r.username = f.username
         WHERE ${conditions} 
           AND f.completed = true`,
        queryParams
      );

      // Get total count of pending students
      const [pendingCount] = await db.query(
        `SELECT COUNT(*) as total
         FROM registrations r
         LEFT JOIN final f ON r.username = f.username
         WHERE ${conditions} 
           AND (f.completed = false OR f.username IS NULL)`,
        queryParams
      );

      return NextResponse.json({ 
        success: true,
        data: {
          completedStudents,
          pendingStudents,
          pagination: {
            completedTotal: completedCount[0]?.total || 0,
            pendingTotal: pendingCount[0]?.total || 0,
            currentPage: {
              completed: completedPage,
              pending: pendingPage
            },
            totalPages: {
              completed: Math.ceil((completedCount[0]?.total || 0) / limit),
              pending: Math.ceil((pendingCount[0]?.total || 0) / limit)
            }
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