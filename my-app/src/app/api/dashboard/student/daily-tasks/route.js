import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

// POST — save/update a specific day's task data
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (payload.role !== 'student')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { day, data } = await request.json();
    if (!day || !data)
      return NextResponse.json({ error: 'Missing day or data' }, { status: 400 });

    const db = await pool.getConnection();
    try {
      // Ensure table exists
      await db.execute(`
        CREATE TABLE IF NOT EXISTS dailyTasks (
          id          INT          AUTO_INCREMENT PRIMARY KEY,
          username    VARCHAR(255) NOT NULL,
          day         TINYINT      NOT NULL,
          data        JSON         NOT NULL,
          submittedAt TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
          updatedAt   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_user_day (username, day)
        )
      `);

      await db.execute(
        `INSERT INTO dailyTasks (username, day, data)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           data = VALUES(data),
           updatedAt = CURRENT_TIMESTAMP`,
        // submittedAt intentionally excluded from UPDATE — preserves original submission time
        [payload.username, day, JSON.stringify(data)]
      );

      return NextResponse.json({ success: true, message: `Day ${day} saved successfully.` });
    } finally {
      db.release();
    }
  } catch (error) {
    console.error('Error saving daily task:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET — fetch all daily task submissions for the logged-in student
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (payload.role !== 'student')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = await pool.getConnection();
    try {
      // Ensure table exists
      await db.execute(`
        CREATE TABLE IF NOT EXISTS dailyTasks (
          id          INT          AUTO_INCREMENT PRIMARY KEY,
          username    VARCHAR(255) NOT NULL,
          day         TINYINT      NOT NULL,
          data        JSON         NOT NULL,
          submittedAt TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
          updatedAt   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_user_day (username, day)
        )
      `);

      const [rows] = await db.execute(
        'SELECT day, data, submittedAt, updatedAt FROM dailyTasks WHERE username = ? ORDER BY day',
        [payload.username]
      );

      const taskMap = {};
      rows.forEach(row => {
        taskMap[row.day] = {
          data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
          submittedAt: row.submittedAt,
          updatedAt: row.updatedAt,
        };
      });

      // Fetch unlocked days
      await db.execute(`
        CREATE TABLE IF NOT EXISTS unlockedDays (
          username VARCHAR(255) NOT NULL,
          day TINYINT NOT NULL,
          unlockedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (username, day)
        )
      `);
      
      const [unlockedRows] = await db.execute(
        'SELECT day FROM unlockedDays WHERE username = ?',
        [payload.username]
      );
      const unlockedDays = unlockedRows.map(r => r.day);

      return NextResponse.json({ success: true, tasks: taskMap, unlockedDays });
    } finally {
      db.release();
    }
  } catch (error) {
    console.error('Error fetching daily tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
