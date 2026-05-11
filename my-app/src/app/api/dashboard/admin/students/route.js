import { NextResponse } from 'next/server';
import pool, { defaultPool } from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/activityLog';

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

    // Verify that the user is an admin in database (ALWAYS USE CURRENT DB FOR AUTH)
    const userQuery = 'SELECT role FROM users WHERE username = ?';
    const [userRows] = await defaultPool.query(userQuery, [decoded.username]);

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
    const fieldOfInterest = searchParams.get('fieldOfInterest');
    const accommodation = searchParams.get('accommodation');
    const transportation = searchParams.get('transportation');
    const season = searchParams.get('season') || '2026';
    const itemsPerPage = 30;
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
      conditions.push('(r.name LIKE ? OR r.email LIKE ? OR r.selectedDomain LIKE ? OR r.fieldOfInterest LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (gender) {
      conditions.push('r.gender = ?');
      params.push(gender);
    }
    if (fieldOfInterest) {
      conditions.push('r.fieldOfInterest = ?');
      params.push(fieldOfInterest);
    }
    if (accommodation) {
      conditions.push('r.accommodation = ?');
      params.push(accommodation);
    }
    if (transportation) {
      conditions.push('r.transportation = ?');
      params.push(transportation);
    }
    if (season) {
      conditions.push('r.season = ?');
      params.push(season);
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
        r.fieldOfInterest,
        f.completed,
        sl.name as leadName,
        fm.name as facultyName,
        r.updatedAt
      FROM registrations r
      LEFT JOIN final f ON r.username = f.username
      LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
      LEFT JOIN facultyMentors fm ON r.facultyMentorId = fm.username
      ${whereClause}
      ORDER BY r.slot
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

      // Delete from child tables of sstudents first
      await connection.query('DELETE FROM suploads WHERE username = ?', [username]);
      await connection.query('DELETE FROM sstatus WHERE username = ?', [username]);
      await connection.query('DELETE FROM sattendance WHERE username = ?', [username]);
      await connection.query('DELETE FROM smessages WHERE username = ?', [username]);
      await connection.query('DELETE FROM sdailyMarks WHERE username = ?', [username]);
      await connection.query('DELETE FROM sstudents WHERE username = ?', [username]);

      // Delete from child tables of registrations
      await connection.query('DELETE FROM surveyResponses WHERE username = ?', [username]);
      await connection.query('DELETE FROM problemStatements WHERE username = ?', [username]);
      await connection.query('DELETE FROM certificates WHERE username = ?', [username]);
      await connection.query('DELETE FROM messages WHERE username = ?', [username]);
      await connection.query('DELETE FROM status WHERE username = ?', [username]);
      
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

      logActivity({
        action: 'ADMIN_DELETE_STUDENT',
        actorUsername: decoded.username,
        actorName: decoded.name,
        actorRole: 'admin',
        targetUsername: username,
        details: { slot, mode }
      }).catch(() => {});
      
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
export async function PATCH(request) {
  try {
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
        error: 'Access denied. Only admin members can perform this action.',
      }, { status: 403 });
    }

    const { username, mode, slot } = await request.json();

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    const VALID_MODES = ['Remote', 'Incampus', 'InVillage'];
    const VALID_SLOTS = ['1','2','3','4','5','6','7','8','9'];

    if (mode && !VALID_MODES.includes(mode)) {
      return NextResponse.json({ success: false, error: 'Invalid mode value' }, { status: 400 });
    }
    if (slot && !VALID_SLOTS.includes(String(slot))) {
      return NextResponse.json({ success: false, error: 'Invalid slot value' }, { status: 400 });
    }

    const setClauses = [];
    const params = [];

    if (mode) { setClauses.push('mode = ?'); params.push(mode); }
    if (slot) { setClauses.push('slot = ?'); params.push(String(slot)); }

    if (setClauses.length === 0) {
      return NextResponse.json({ success: false, error: 'Nothing to update' }, { status: 400 });
    }

    params.push(username);

    const connection = await pool.getConnection();
    try {
      const [result] = await connection.query(
        `UPDATE registrations SET ${setClauses.join(', ')} WHERE username = ?`,
        params
      );

      if (result.affectedRows === 0) {
        return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
      }

      logActivity({
        action: 'ADMIN_UPDATE_STUDENT_MODE_SLOT',
        actorUsername: decoded.username,
        actorName: decoded.name,
        actorRole: 'admin',
        targetUsername: username,
        details: { mode, slot },
      }).catch(() => {});

      return NextResponse.json({ success: true, message: 'Student updated successfully', mode, slot });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error in PATCH student API:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}