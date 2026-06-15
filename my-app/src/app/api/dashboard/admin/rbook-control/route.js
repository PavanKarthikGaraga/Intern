import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

const ensureTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS rbookControl (
      slot      TINYINT  NOT NULL PRIMARY KEY,
      visible   TINYINT  NOT NULL DEFAULT 1,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  // Seed all 9 slots with visible=1 (shown by default)
  for (let s = 1; s <= 9; s++) {
    await db.query(
      'INSERT IGNORE INTO rbookControl (slot, visible) VALUES (?, 1)', [s]
    );
  }
};

// ── GET — return all slot rbook visibility states (admin) ─────────────────────
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await verifyAccessToken(token);
    if (decoded.role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const db = await pool.getConnection();
    try {
      await ensureTable(db);
      const [rows] = await db.query('SELECT slot, visible FROM rbookControl ORDER BY slot');
      return NextResponse.json({ success: true, slots: rows });
    } finally { db.release(); }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── POST — toggle report book visibility for a slot (admin only) ──────────────
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await verifyAccessToken(token);
    if (decoded.role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { slot, visible } = await request.json();
    if (!slot || slot < 1 || slot > 9)
      return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });

    const db = await pool.getConnection();
    try {
      await ensureTable(db);
      await db.query(
        'UPDATE rbookControl SET visible = ? WHERE slot = ?',
        [visible ? 1 : 0, slot]
      );
      return NextResponse.json({ success: true, slot, visible: !!visible });
    } finally { db.release(); }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
