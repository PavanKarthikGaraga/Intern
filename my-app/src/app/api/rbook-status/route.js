import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

// Any authenticated student can check whether their slot's report book is visible
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const decoded = await verifyAccessToken(token);
    const username = decoded.username;

    // Demo student bypass — always visible
    if (username === '2500099999') {
      return NextResponse.json({ success: true, slot: 1, visible: true });
    }

    const db = await pool.getConnection();
    try {
      // Get the student's slot
      const [[reg]] = await db.query(
        'SELECT slot FROM registrations WHERE username = ?', [username]
      );
      if (!reg) return NextResponse.json({ success: true, slot: null, visible: true });

      const slot = reg.slot;

      // Check rbookControl table (if missing, default to visible)
      let visible = true;
      try {
        const [[ctrl]] = await db.query(
          'SELECT visible FROM rbookControl WHERE slot = ?', [slot]
        );
        visible = ctrl ? Boolean(ctrl.visible) : true;
      } catch (tableErr) {
        if (tableErr.code !== 'ER_NO_SUCH_TABLE') throw tableErr;
        // Table not created yet → default visible
      }

      return NextResponse.json({ success: true, slot, visible });
    } finally { db.release(); }
  } catch (e) {
    if (e.code === 'ER_NO_SUCH_TABLE') {
      return NextResponse.json({ success: true, slot: null, visible: true });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
