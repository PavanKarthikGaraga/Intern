import { NextResponse } from 'next/server';
import pool, { defaultPool } from '@/lib/db';
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
        error: 'Access denied. Only admin members can access activity logs.' 
      }, { status: 403 });
    }

    // Verify that the user is an admin in database (ALWAYS USE CURRENT DB FOR AUTH)
    const userQuery = 'SELECT role FROM users WHERE username = ?';
    const [userRows] = await defaultPool.query(userQuery, [decoded.username]);

    if (!userRows || userRows.length === 0 || userRows[0].role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Admin role required.' 
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = Math.min(parseInt(searchParams.get('limit')) || 30, 100);
    const action = searchParams.get('action');
    const actorUsername = searchParams.get('actorUsername');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const offset = (page - 1) * limit;

    let conditions = [];
    let params = [];

    if (action) {
      conditions.push('action = ?');
      params.push(action);
    }
    if (actorUsername) {
      conditions.push('actorUsername = ?');
      params.push(actorUsername);
    }
    if (startDate) {
      conditions.push('createdAt >= ?');
      params.push(startDate);
    }
    if (endDate) {
      conditions.push('createdAt <= ?');
      params.push(endDate + ' 23:59:59');
    }
    if (search) {
      conditions.push('(actorUsername LIKE ? OR actorName LIKE ? OR targetUsername LIKE ? OR details LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
      const [countResult] = await pool.query(
        `SELECT COUNT(*) as total FROM activityLogs ${whereClause}`,
        params
      );
      const totalItems = countResult[0].total;
      const totalPages = Math.ceil(totalItems / limit);

      const [logs] = await pool.query(
        `SELECT * FROM activityLogs ${whereClause} ORDER BY createdAt DESC LIMIT ? OFFSET ?`,
        [...params, limit, offset]
      );

      const [actionTypes] = await pool.query(
        'SELECT DISTINCT action FROM activityLogs ORDER BY action'
      );

      return NextResponse.json({
        success: true,
        data: {
          logs,
          actionTypes: actionTypes.map(a => a.action),
          pagination: {
            currentPage: page,
            totalPages,
            totalItems,
            itemsPerPage: limit
          }
        }
      });
    } catch (dbError) {
      console.error('Database error in activity logs:', dbError);
      // If table doesn't exist or other DB error, return empty data
      return NextResponse.json({
        success: true,
        data: {
          logs: [],
          actionTypes: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            itemsPerPage: limit
          }
        }
      });
    }

  } catch (error) {
    console.error('Error in activity logs API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
