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
    const slot = searchParams.get('slot');

    if (!slot) {
      return NextResponse.json({ success: false, error: 'Slot is required' }, { status: 400 });
    }

    // Ensure reportBookMarks column exists before querying
    try {
      await db.execute(`ALTER TABLE reportBooks ADD COLUMN reportBookMarks DECIMAL(4,2) DEFAULT NULL`);
    } catch (e) { /* ignore, column may already exist */ }

    const [rows] = await db.execute(
      `SELECT r.username, r.name, r.slot, rb.reportLink, rb.status, rb.adminRemarks, rb.utrId, rb.reportBookMarks, rb.id as rbId,
              (COALESCE(dm.day1,0) + COALESCE(dm.day2,0) + COALESCE(dm.day3,0) + COALESCE(dm.day4,0) + COALESCE(dm.day5,0) + COALESCE(dm.day6,0) + COALESCE(dm.day7,0)) AS totalMarks
       FROM registrations r
       JOIN reportBooks rb ON r.username = rb.username
       LEFT JOIN dailyMarks dm ON r.username = dm.username
       WHERE r.slot = ?
       ORDER BY rb.updatedAt DESC`,
      [slot]
    );

    return NextResponse.json({ success: true, reports: rows });
  } catch (error) {
    console.error('Error fetching final reports:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
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

    const { username, status, adminRemarks, reportBookMarks } = await request.json();

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    // Ensure reportBookMarks column exists
    try {
      await db.execute(`ALTER TABLE reportBooks ADD COLUMN reportBookMarks DECIMAL(4,2) DEFAULT NULL`);
    } catch (e) { /* column may already exist */ }

    // If reportBookMarks is provided, save marks with the given status (or APPROVED as fallback)
    if (reportBookMarks !== undefined && reportBookMarks !== null && reportBookMarks !== '') {
      const marks = Number(reportBookMarks);
      if (isNaN(marks) || marks < 0 || marks > 20) {
        return NextResponse.json({ success: false, error: 'Report Book Marks must be between 0 and 20' }, { status: 400 });
      }
      // Use the admin-provided status; fall back to APPROVED only if none given
      const finalStatus = status || 'APPROVED';
      await db.execute(
        'UPDATE reportBooks SET reportBookMarks = ?, status = ?, adminRemarks = ? WHERE username = ?',
        [marks, finalStatus, adminRemarks || null, username]
      );
      return NextResponse.json({ success: true, message: 'Marks saved successfully.' });
    }

    // Manual status/remarks update
    if (!status) {
      return NextResponse.json({ success: false, error: 'Status or marks are required' }, { status: 400 });
    }

    await db.execute(
      'UPDATE reportBooks SET status = ?, adminRemarks = ? WHERE username = ?',
      [status, adminRemarks || null, username]
    );

    return NextResponse.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating final report status:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
