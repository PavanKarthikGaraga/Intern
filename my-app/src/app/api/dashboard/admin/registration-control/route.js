import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

const ensureTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS registrationControl (
      slot             TINYINT   NOT NULL PRIMARY KEY,
      registrationOpen TINYINT   NOT NULL DEFAULT 1,
      updatedAt        TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  // Seed all 9 slots as OPEN by default
  for (let s = 1; s <= 9; s++) {
    await db.query(
      'INSERT IGNORE INTO registrationControl (slot, registrationOpen) VALUES (?, 1)', [s]
    );
  }
};

// ── GET — return all slot registration states ──────────────────────────────────
export async function GET() {
  const db = await pool.getConnection();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await verifyAccessToken(token);
    if (decoded.role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await ensureTable(db);
    const [rows] = await db.query('SELECT slot, registrationOpen FROM registrationControl ORDER BY slot');
    return NextResponse.json({ success: true, slots: rows });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally { db.release(); }
}

// ── POST — toggle a slot's registration open/close ────────────────────────────
export async function POST(request) {
  const db = await pool.getConnection();
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await verifyAccessToken(token);
    if (decoded.role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { slot, open } = await request.json();
    if (!slot || slot < 1 || slot > 9)
      return NextResponse.json({ error: 'Invalid slot (must be 1–9)' }, { status: 400 });

    await ensureTable(db);
    await db.query(
      'UPDATE registrationControl SET registrationOpen = ? WHERE slot = ?',
      [open ? 1 : 0, slot]
    );
    return NextResponse.json({ success: true, slot, open: !!open });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  } finally { db.release(); }
}
