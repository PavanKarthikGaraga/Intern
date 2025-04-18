import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

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
        error: 'Access denied. Only admin members can access this data.' 
      }, { status: 403 });
    }

    // Verify that the user is an admin in database
    const userQuery = 'SELECT role FROM users WHERE username = ?';
    const [userRows] = await pool.query(userQuery, [decoded.username]);

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found in database' 
      }, { status: 404 });
    }

    const userRole = userRows[0].role;

    if (userRole !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: `User role is ${userRole}, but admin role is required` 
      }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const domain = searchParams.get('domain');
    const slot = searchParams.get('slot');
    const mode = searchParams.get('mode');

    // Build query conditions
    const conditions = ['r.completed = 1'];
    const params = [];

    if (domain) {
      conditions.push('r.selectedDomain = ?');
      params.push(domain);
    }

    if (slot) {
      conditions.push('r.slot = ?');
      params.push(slot);
    }

    if (mode) {
      conditions.push('r.mode = ?');
      params.push(mode);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const [totalCount] = await pool.query(
      `SELECT COUNT(*) as total FROM registrations r ${whereClause}`,
      params
    );

    // Calculate pagination
    const total = totalCount[0].total;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // Get completed students with pagination
    const [students] = await pool.query(`
      SELECT 
        r.username,
        r.name,
        r.selectedDomain,
        r.mode,
        r.slot,
        r.email,
        r.phoneNumber,
        r.completed,
        sl.name as leadName,
        fm.name as facultyName,
        cs.studentDetails
      FROM registrations r
      LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
      LEFT JOIN facultyMentors fm ON r.facultyMentorId = fm.username
      LEFT JOIN completedStudents cs ON r.username = cs.username
      ${whereClause}
      ORDER BY r.name ASC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    return NextResponse.json({
      success: true,
      data: {
        students,
        pagination: {
          currentPage: page,
          totalPages,
          totalStudents: total,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error in admin completed students API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 