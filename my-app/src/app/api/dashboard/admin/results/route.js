import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken');
    if (!accessToken?.value) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifyAccessToken(accessToken.value);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const slot = searchParams.get('slot') || '1';

    const [rows] = await db.execute(
      `SELECT 
          r.username, 
          r.name, 
          r.slot,
          dm.day1, dm.day2, dm.day3, dm.day4, dm.day5, dm.day6, dm.day7,
          (COALESCE(dm.day1, 0) + COALESCE(dm.day2, 0) + COALESCE(dm.day3, 0) + 
           COALESCE(dm.day4, 0) + COALESCE(dm.day5, 0) + COALESCE(dm.day6, 0) + 
           COALESCE(dm.day7, 0)) AS totalMarks
       FROM registrations r
       LEFT JOIN dailyMarks dm ON r.username = dm.username
       WHERE r.slot = ?
       ORDER BY totalMarks DESC, r.username ASC`,
      [slot]
    );

    return NextResponse.json({ success: true, results: rows });
  } catch (error) {
    console.error('Error fetching results:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
