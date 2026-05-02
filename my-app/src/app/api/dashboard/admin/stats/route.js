import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { DOMAINS } from '@/app/Data/domains';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('accessToken');
    if (!accessToken?.value)
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });

    const decoded = await verifyAccessToken(accessToken.value);
    if (!decoded || decoded.role !== 'admin')
      return NextResponse.json({ success: false, error: 'Access denied.' }, { status: 403 });

    // ── Live query: per-slot counts directly from registrations ──────────────
    const [slotRows] = await pool.query(`
      SELECT
        slot,
        COUNT(*)                                                                 AS total,
        SUM(CASE WHEN LOWER(TRIM(COALESCE(mode,''))) IN ('remote','hometown') THEN 1 ELSE 0 END) AS remote,
        SUM(CASE WHEN LOWER(TRIM(COALESCE(mode,''))) IN ('incampus','in campus','in-campus') THEN 1 ELSE 0 END) AS incampus,
        SUM(CASE WHEN LOWER(TRIM(COALESCE(mode,''))) IN ('invillage','in village','in-village') THEN 1 ELSE 0 END) AS invillage
      FROM registrations
      WHERE slot IS NOT NULL
      GROUP BY slot
      ORDER BY CAST(slot AS UNSIGNED)
    `);

    // ── Overview totals ───────────────────────────────────────────────────────
    const [overviewRows] = await pool.query(`
      SELECT
        COUNT(*) AS totalStudents,
        SUM(CASE WHEN f.completed = 1 THEN 1 ELSE 0 END) AS totalCompleted,
        SUM(CASE WHEN f.completed = 1 THEN 0 ELSE 1 END) AS totalActive
      FROM registrations r
      LEFT JOIN final f ON r.username = f.username
    `);
    const overview = overviewRows[0] || {};
    const totalStudents  = Number(overview.totalStudents)  || 0;
    const totalCompleted = Number(overview.totalCompleted) || 0;
    const totalActive    = Number(overview.totalActive)    || 0;

    // ── Build slots object from live data ─────────────────────────────────────
    const slotsObj = {};
    const availableSlots = [];
    slotRows.forEach(row => {
      const n = row.slot;
      availableSlots.push(n);
      const remote    = Math.max(0, Number(row.remote)    || 0);
      const incampus  = Math.max(0, Number(row.incampus)  || 0);
      const invillage = Math.max(0, Number(row.invillage) || 0);
      const total     = Math.max(0, Number(row.total)     || 0);
      // unknown = rows whose mode didn't match any known value
      const unknown   = Math.max(0, total - remote - incampus - invillage);
      slotsObj[`slot${n}`] = { total, remote, incampus, invillage, unknown };
    });

    // ── Domain stats: include ALL 20 domains, even those with 0 students ──────
    // Pull actual counts from registrations
    const [domainRows] = await pool.query(`
      SELECT selectedDomain, COUNT(*) AS total,
             SUM(CASE WHEN f.completed = 1 THEN 1 ELSE 0 END) AS completed,
             SUM(CASE WHEN f.completed = 1 THEN 0 ELSE 1 END) AS active
      FROM registrations r
      LEFT JOIN final f ON r.username = f.username
      GROUP BY r.selectedDomain
    `);

    // Build a map of DB results keyed by domain name
    const dbMap = {};
    domainRows.forEach(row => { dbMap[row.selectedDomain] = row; });

    // Merge with full domain list so all 20 appear
    const domainStats = DOMAINS.map(d => ({
      selectedDomain: d.name,
      total:     Number(dbMap[d.name]?.total     ?? 0),
      completed: Number(dbMap[d.name]?.completed ?? 0),
      active:    Number(dbMap[d.name]?.active    ?? 0),
    })).sort((a, b) => b.total - a.total);

    // ── Mode stats ────────────────────────────────────────────────────────────
    const [modeStats] = await pool.query(`
      SELECT
        r.mode,
        COUNT(*) AS total,
        SUM(CASE WHEN f.completed = 1 THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN f.completed = 1 THEN 0 ELSE 1 END) AS active
      FROM registrations r
      LEFT JOIN final f ON r.username = f.username
      GROUP BY r.mode
    `);

    return NextResponse.json({
      success: true,
      stats: {
        overview: {
          totalStudents,
          totalCompleted,
          totalActive,
          completionRate: totalStudents
            ? ((totalCompleted / totalStudents) * 100).toFixed(2)
            : '0.00',
        },
        slots: slotsObj,
        availableSlots,
        domainStats: domainStats || [],
        modeStats:   modeStats   || [],
      },
    });

  } catch (error) {
    console.error('Error in admin stats endpoint:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}