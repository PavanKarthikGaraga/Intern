import { NextResponse } from 'next/server';
import pool from '@/lib/db';

/**
 * Public endpoint — no auth required.
 * Returns which slots have registration open.
 * GET /api/register/slot-availability
 */
export async function GET() {
  const db = await pool.getConnection();
  try {
    // Check if the table exists; if not, all slots are open
    const [tables] = await db.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'registrationControl'`
    );

    if (!tables || tables.length === 0) {
      // Table doesn't exist yet — all 9 slots open
      const slots = Array.from({ length: 9 }, (_, i) => ({
        slot: i + 1,
        registrationOpen: 1,
      }));
      return NextResponse.json({ success: true, slots });
    }

    const [rows] = await db.query(
      'SELECT slot, registrationOpen FROM registrationControl ORDER BY slot'
    );

    // Fill any missing slots as open
    const map = {};
    rows.forEach(r => { map[r.slot] = r.registrationOpen; });
    const slots = Array.from({ length: 9 }, (_, i) => ({
      slot: i + 1,
      registrationOpen: map[i + 1] !== undefined ? map[i + 1] : 1,
    }));

    return NextResponse.json({ success: true, slots });
  } catch (e) {
    // On any error, fail open so registration is never accidentally broken
    const slots = Array.from({ length: 9 }, (_, i) => ({ slot: i + 1, registrationOpen: 1 }));
    return NextResponse.json({ success: true, slots });
  } finally { db.release(); }
}
