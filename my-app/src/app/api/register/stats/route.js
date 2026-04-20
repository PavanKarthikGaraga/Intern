import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    let stats;

    // Try season-filtered query (works after migration_2026.sql is run)
    // Falls back to the plain query if the 'season' column doesn't exist yet
    try {
      const [rows] = await pool.query(
        "SELECT * FROM stats WHERE season = '2026' ORDER BY id DESC LIMIT 1"
      );
      stats = rows;
    } catch (seasonErr) {
      // Column likely doesn't exist yet — fall back to original query
      const [rows] = await pool.query('SELECT * FROM stats ORDER BY id DESC LIMIT 1');
      stats = rows;
    }

    // If no stats found, return default values
    if (!stats || stats.length === 0) {
      const defaultStats = {
        totalStudents: 0,
        totalCompleted: 0,
        totalActive: 0,
        // Y-25 slots 1-6
        slot1: 0, slot2: 0, slot3: 0, slot4: 0, slot5: 0, slot6: 0,
        // Y-24 slots 7-9
        slot7: 0, slot8: 0, slot9: 0,
        remote: 0, incampus: 0, invillage: 0,
        // Slot mode breakdowns
        slot1Remote: 0, slot1Incamp: 0, slot1Invillage: 0,
        slot2Remote: 0, slot2Incamp: 0, slot2Invillage: 0,
        slot3Remote: 0, slot3Incamp: 0, slot3Invillage: 0,
        slot4Remote: 0, slot4Incamp: 0, slot4Invillage: 0,
        slot5Remote: 0, slot5Incamp: 0, slot5Invillage: 0,
        slot6Remote: 0, slot6Incamp: 0, slot6Invillage: 0,
        slot7Remote: 0, slot7Incamp: 0, slot7Invillage: 0,
        slot8Remote: 0, slot8Incamp: 0, slot8Invillage: 0,
        slot9Remote: 0, slot9Incamp: 0, slot9Invillage: 0,
      };

      return NextResponse.json({
        success: true,
        stats: defaultStats
      });
    }

    return NextResponse.json({
      success: true,
      stats: stats[0]
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch stats'
    }, { status: 500 });
  }
}
