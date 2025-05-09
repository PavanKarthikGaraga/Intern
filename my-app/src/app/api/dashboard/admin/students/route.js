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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const domain = searchParams.get('domain');
    const slot = searchParams.get('slot');
    const mode = searchParams.get('mode');
    const search = searchParams.get('search');
    const gender = searchParams.get('gender');
    const itemsPerPage = 10;
    const offset = (page - 1) * itemsPerPage;

    let conditions = [];
    let params = [];

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
    if (search) {
      conditions.push('(r.name LIKE ? OR r.email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }
    if (gender) {
      conditions.push('r.gender = ?');
      params.push(gender);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM registrations r
      ${whereClause}
    `;

    const [countResult] = await pool.query(countQuery, params);
    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    const studentsQuery = `
      SELECT 
        r.username,
        r.name,
        r.selectedDomain,
        r.mode,
        r.slot,
        r.email,
        r.phoneNumber,
        f.completed,
        sl.name as leadName,
        fm.name as facultyName,
        r.updatedAt
      FROM registrations r
      LEFT JOIN final f ON r.username = f.username
      LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
      LEFT JOIN facultyMentors fm ON r.facultyMentorId = fm.username
      ${whereClause}
      ORDER BY r.updatedAt DESC
      LIMIT ? OFFSET ?
    `;

    const [students] = await pool.query(studentsQuery, [...params, itemsPerPage, offset]);

    return NextResponse.json({
      success: true,
      data: {
        students,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems,
          itemsPerPage
        }
      }
    });

  } catch (error) {
    console.error('Error in admin students API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
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
        error: 'Access denied. Only admin members can perform this action.' 
      }, { status: 403 });
    }

    const data = await request.json();
    const { username } = data;

    if (!username) {
      return NextResponse.json({ 
        success: false, 
        error: 'Username is required' 
      }, { status: 400 });
    }

    // Start a transaction
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // First, get the student's slot and mode before deleting
      const [studentData] = await connection.query(
        'SELECT slot, mode FROM registrations WHERE username = ?',
        [username]
      );

      if (!studentData || studentData.length === 0) {
        throw new Error('Student not found');
      }

      const { slot, mode } = studentData[0];

      // Delete from tables in correct order to handle foreign key constraints
      await connection.query('DELETE FROM marks WHERE username = ?', [username]);
      await connection.query('DELETE FROM dailyMarks WHERE username = ?', [username]);
      await connection.query('DELETE FROM verify WHERE username = ?', [username]);
      await connection.query('DELETE FROM attendance WHERE username = ?', [username]);
      await connection.query('DELETE FROM uploads WHERE username = ?', [username]);
      await connection.query('DELETE FROM final WHERE username = ?', [username]);
      await connection.query('DELETE FROM registrations WHERE username = ?', [username]);
      await connection.query('DELETE FROM users WHERE username = ?', [username]);


      // Update stats table
      let slotModeField;
      if (mode === 'Remote') {
        slotModeField = `slot${slot}Remote`;
      } else if (mode === 'Incampus') {
        slotModeField = `slot${slot}Incamp`;
      } else if (mode === 'InVillage') {
        slotModeField = `slot${slot}Invillage`;
      }
      const updateStatsQuery = `
        UPDATE stats 
        SET 
          totalStudents = totalStudents - 1,
          slot${slot} = slot${slot} - 1,
          ${mode.toLowerCase()} = ${mode.toLowerCase()} - 1,
          ${slotModeField} = ${slotModeField} - 1
        WHERE id = (SELECT id FROM (SELECT id FROM stats ORDER BY id DESC LIMIT 1) as temp)
      `;

      await connection.query(updateStatsQuery);

      await connection.commit();
      
      return NextResponse.json({
        success: true,
        message: 'Student deleted successfully'
      });
    } catch (error) {
      await connection.rollback();
      console.error('Database error:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to delete student' 
      }, { status: 500 });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in delete student API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 