import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

// Public-ish: any authenticated user can check their own slot status
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await verifyAccessToken(token);
    const username = decoded.username;

    const db = await pool.getConnection();
    try {
      // Get the student's slot
      const [[reg]] = await db.query(
        'SELECT slot FROM registrations WHERE username = ?', [username]
      );
      if (!reg) return NextResponse.json({ enabled: false, slot: null });

      const slot = reg.slot;

      // Check slotControl
      let [[ctrl]] = await db.query(
        'SELECT enabled FROM slotControl WHERE slot = ?', [slot]
      );
      // If table doesn't exist yet or row missing, treat as disabled
      const enabled = ctrl ? Boolean(ctrl.enabled) : false;

      return NextResponse.json({ success: true, slot, enabled });
    } finally { db.release(); }
  } catch (e) {
    // If slotControl table doesn't exist, return disabled gracefully
    if (e.code === 'ER_NO_SUCH_TABLE') return NextResponse.json({ success: true, slot: null, enabled: false });
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
