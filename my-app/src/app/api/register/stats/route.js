import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    // Get the stats from the database
    const [stats] = await pool.query('SELECT * FROM stats ORDER BY id DESC LIMIT 1');

    // If no stats found, return default values
    if (!stats || stats.length === 0) {
      const defaultStats = {
        totalStudents: 0,
        totalCompleted: 0,
        totalActive: 0,
        slot1: 0,
        slot2: 0,
        slot3: 0,
        slot4: 0,
        remote: 0,
        incampus: 0,
        slot1Remote: 0,
        slot1Incamp: 0,
        slot2Remote: 0,
        slot2Incamp: 0,
        slot3Remote: 0,
        slot3Incamp: 0,
        slot4Remote: 0,
        slot4Incamp: 0
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
