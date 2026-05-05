import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (payload.role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    if (!username) return NextResponse.json({ error: 'Username required' }, { status: 400 });

    const db = await pool.getConnection();
    try {
      // Get student details
      const [userRows] = await db.query('SELECT name, username FROM users WHERE username = ? AND role = "student"', [username]);
      if (!userRows.length) return NextResponse.json({ success: false, error: 'Student not found' });
      
      const [regRows] = await db.query('SELECT slot FROM registrations WHERE username = ?', [username]);
      const slot = regRows.length ? regRows[0].slot : null;

      // Get submitted days
      await db.execute(`
        CREATE TABLE IF NOT EXISTS dailyTasks (
          id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255) NOT NULL,
          day TINYINT NOT NULL, data JSON NOT NULL, submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_user_day (username, day)
        )
      `);
      const [tasksRows] = await db.query('SELECT day FROM dailyTasks WHERE username = ?', [username]);
      const submittedDays = tasksRows.map(r => r.day);

      // Get unlocked days
      await db.execute(`
        CREATE TABLE IF NOT EXISTS unlockedDays (
          username VARCHAR(255) NOT NULL, day TINYINT NOT NULL,
          unlockedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (username, day)
        )
      `);
      const [unlockedRows] = await db.query('SELECT day FROM unlockedDays WHERE username = ?', [username]);
      const unlockedDays = unlockedRows.map(r => r.day);

      return NextResponse.json({
        success: true,
        username,
        name: userRows[0].name,
        slot,
        submittedDays,
        unlockedDays
      });
    } finally {
      db.release();
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (payload.role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { username, day, unlock } = await req.json();
    if (!username || !day) return NextResponse.json({ error: 'Username and day required' }, { status: 400 });

    const db = await pool.getConnection();
    try {
      await db.execute(`
        CREATE TABLE IF NOT EXISTS unlockedDays (
          username VARCHAR(255) NOT NULL, day TINYINT NOT NULL,
          unlockedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (username, day)
        )
      `);

      if (unlock) {
        await db.query('INSERT IGNORE INTO unlockedDays (username, day) VALUES (?, ?)', [username, day]);
      } else {
        await db.query('DELETE FROM unlockedDays WHERE username = ? AND day = ?', [username, day]);
      }

      return NextResponse.json({ success: true });
    } finally {
      db.release();
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
