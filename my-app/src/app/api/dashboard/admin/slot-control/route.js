import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

const ensureTable = async (db) => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS slotControl (
      slot      TINYINT  NOT NULL PRIMARY KEY,
      enabled   TINYINT  NOT NULL DEFAULT 0,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);
  // Seed all 9 slots if not present
  for (let s = 1; s <= 9; s++) {
    await db.query(
      'INSERT IGNORE INTO slotControl (slot, enabled) VALUES (?, 0)', [s]
    );
  }
};

// ── GET — return all slot states (admin) ──────────────────────────────────────
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
      const [rows] = await db.query('SELECT slot, enabled FROM slotControl ORDER BY slot');
      return NextResponse.json({ success: true, slots: rows });
    } finally { db.release(); }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// ── POST — toggle a slot on/off (admin only) ──────────────────────────────────
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await verifyAccessToken(token);
    if (decoded.role !== 'admin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { slot, enabled } = await request.json();
    if (!slot || slot < 1 || slot > 9)
      return NextResponse.json({ error: 'Invalid slot' }, { status: 400 });

    const db = await pool.getConnection();
    try {
      await ensureTable(db);
      await db.query(
        'UPDATE slotControl SET enabled = ? WHERE slot = ?',
        [enabled ? 1 : 0, slot]
      );
      return NextResponse.json({ success: true, slot, enabled: !!enabled });
    } finally { db.release(); }
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
