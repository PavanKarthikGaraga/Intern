import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('accessToken');
    if (!accessToken?.value) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const decoded = await verifyAccessToken(accessToken.value);
    if (!decoded || decoded.role !== 'student') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { username, link, utrId } = await request.json();

    if (!username) {
      return NextResponse.json({ success: false, error: 'Username is required' }, { status: 400 });
    }

    if (username !== decoded.username) {
      return NextResponse.json({ success: false, error: 'Unauthorized user action' }, { status: 403 });
    }

    // Verify student is Slot 1
    const [regRows] = await db.execute('SELECT slot FROM registrations WHERE username = ?', [username]);
    if (regRows.length === 0 || Number(regRows[0].slot) !== 1) {
      return NextResponse.json({ success: false, error: 'Only Slot 1 students can submit this report' }, { status: 403 });
    }

    // Create reportBooks table if it doesn't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS reportBooks (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(10) NOT NULL UNIQUE,
        reportLink VARCHAR(500) DEFAULT NULL,
        status ENUM('PENDING_REVIEW', 'REJECTED', 'APPROVED', 'PAYMENT_SUBMITTED', 'PRINTING_IN_PROCESS', 'PRINTING_COMPLETED') DEFAULT 'PENDING_REVIEW',
        adminRemarks TEXT DEFAULT NULL,
        utrId VARCHAR(12) DEFAULT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (username) REFERENCES registrations(username)
      )
    `);

    // Check existing record
    const [existing] = await db.execute('SELECT * FROM reportBooks WHERE username = ?', [username]);
    const current = existing[0];

    // Handle UTR Submission
    if (utrId) {
      if (!current || current.status !== 'APPROVED') {
        return NextResponse.json({ success: false, error: 'You are not eligible to submit a UTR yet.' }, { status: 400 });
      }
      if (!/^\d{12}$/.test(utrId)) {
        return NextResponse.json({ success: false, error: 'UTR must be exactly 12 digits.' }, { status: 400 });
      }
      
      await db.execute(
        'UPDATE reportBooks SET utrId = ?, status = "PAYMENT_SUBMITTED" WHERE username = ?',
        [utrId, username]
      );
      return NextResponse.json({ success: true, message: 'UTR submitted successfully.' });
    }

    // Handle Link Submission
    if (link) {
      if (current && !['REJECTED'].includes(current.status)) {
        return NextResponse.json({ success: false, error: 'Report Book is already submitted and cannot be changed unless rejected.' }, { status: 400 });
      }

      if (current) {
        // Resubmitting after rejection
        await db.execute(
          'UPDATE reportBooks SET reportLink = ?, status = "PENDING_REVIEW", adminRemarks = NULL WHERE username = ?',
          [link, username]
        );
      } else {
        // First time submission
        await db.execute(
          'INSERT INTO reportBooks (username, reportLink, status) VALUES (?, ?, "PENDING_REVIEW")',
          [username, link]
        );
      }
      return NextResponse.json({ success: true, message: 'Report link submitted successfully.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid request payload.' }, { status: 400 });
  } catch (error) {
    console.error('Error submitting report book:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
