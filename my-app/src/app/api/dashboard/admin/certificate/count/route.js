import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import db from '@/lib/db';

export async function GET(request) {
  const cookieStore = await cookies();
  const accessToken = await cookieStore.get('accessToken');

  if (!accessToken?.value) {
    return NextResponse.json({
      success: false,
      error: 'Authentication required. Please login again.',
    }, { status: 401 });
  }

  const decoded = await verifyAccessToken(accessToken.value);
  if (!decoded || decoded.role !== 'admin') {
    return NextResponse.json({
      success: false,
      error: 'Access denied. Only admins can access this endpoint.',
    }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const slot = searchParams.get('slot');

    if (!slot) {
      return NextResponse.json(
        { success: false, error: 'Slot is required' },
        { status: 400 }
      );
    }

    // Get count of eligible students (total marks >= 60) for the specified slot
    const [result] = await db.query(`
      SELECT COUNT(*) as count
      FROM marks m
      JOIN registrations r ON m.username = r.username
      WHERE m.internalMarks + m.finalReport + m.finalPresentation >= 60 
      AND m.completed = 'P'
      AND r.slot = ?
    `, [slot]);

    return NextResponse.json({
      success: true,
      count: result[0].count
    });

  } catch (error) {
    console.error('Error getting eligible student count:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 