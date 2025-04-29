import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { sendBulkEmails } from '@/lib/email';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('accessToken');

    if (!accessToken?.value) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required. Please login again.' 
      }, { status: 401 });
    }

    const decoded = await verifyAccessToken(accessToken.value);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only admin members can perform this action.' 
      }, { status: 403 });
    }

    const { ids } = await req.json();

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No IDs provided' 
      }, { status: 400 });
    }

    // Get student data for the provided IDs
    const [students] = await pool.query(`
      SELECT 
        r.username,
        r.name,
        r.selectedDomain,
        r.branch,
        r.year,
        r.phoneNumber
      FROM registrations r
      WHERE r.username IN (?)
    `, [ids]);

    if (students.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid student IDs found' 
      }, { status: 404 });
    }

    // Prepare email data
    const emailData = students.map(student => ({
      email: student.username + '@kluniversity.in',
      template: 'registration',
      data: {
        name: student.name,
        selectedDomain: student.selectedDomain,
        idNumber: student.username,
        phoneNumber: student.phoneNumber,
        branch: student.branch,
        year: student.year
      }
    }));

    // Send bulk emails
    const result = await sendBulkEmails(
      emailData.map(item => item.email),
      'registration',
      emailData.map(item => item.data)
    );

    if (!result.success) {
      throw new Error(result.error || 'Failed to send emails');
    }

    return NextResponse.json({
      success: true,
      totalSent: result.totalSent,
      message: `Successfully queued ${result.totalSent} emails`
    });

  } catch (error) {
    console.error('Error in bulk email API:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
} 