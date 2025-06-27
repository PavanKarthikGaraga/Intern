import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import db from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit'; // ✅ Import fontkit

// Helper to convert marks to grade
function getGrade(marks) {
    // console.log(marks);
  if (marks >= 90) return 'A';
  if (marks >= 75) return 'B';
  if (marks >= 60) return 'C';
  return 'F';
}

// Helper to get slot dates
function getSlotDates(slot) {
  switch (Number(slot)) {
    case 1:
      return { start: '11/05/2025', end: '17/05/2025' };
    case 2:
      return { start: '18/05/2025', end: '24/05/2025' };
    case 3:
      return { start: '25/05/2025', end: '31/05/2025' };
    case 4:
      return { start: '01/06/2025', end: '07/06/2025' };
    default:
      return { start: '', end: '' };
  }
}

// Helper to draw certificate fields at the correct positions
function drawCertificateFields(page, { grade, name, branch, idNumber, start, end, slot, mode, domain, totalMarks, time, uid }, font) {
  page.drawText(grade, { x: 376.29, y: 709.36, size: 16, font, color: rgb(0, 0, 0) });
  page.drawText(name, {  x: 90.35, y: 645.58, size: 11, font, color: rgb(0, 0, 0) });
  page.drawText(branch, { x: 103.27, y: 630.58, size: 11, font, color: rgb(0, 0, 0) });
  page.drawText(`${idNumber},`, { x: 282.2, y: 630.58, size: 11, font, color: rgb(0, 0, 0) });
  page.drawText(start, {x: 239.66, y: 570.56, size: 10, font, color: rgb(0, 0, 0) });
  page.drawText(`${end},`, { x: 316.73, y: 570.56, size: 10, font, color: rgb(0, 0, 0) });
  page.drawText(`${slot} ,`, { x: 228.94, y: 555.55, size: 11, font, color: rgb(0, 0, 0) });
  page.drawText(`${mode}`, { x: 92.82, y: 540.55  , size: 11, font, color: rgb(0, 0, 0) });
  page.drawText(`${domain}.`, { x: 144.93, y: 525.54 , size: 11, font, color: rgb(0, 0, 0) });
  page.drawText(`${totalMarks}`, {  x: 134.71, y: 270.44, size: 11, font, color: rgb(0, 0, 0) });
  page.drawText(grade, {  x: 88.32, y: 255.44 , size: 11, font, color: rgb(0, 0, 0) });
  page.drawText(time, {  x: 438.18, y: 106.13 , size: 10, font, color: rgb(0, 0, 0) });
  page.drawText(uid, {  x: 431.13, y: 91.13 , size: 10, font, color: rgb(0, 0, 0) });
}

export async function GET(req) {
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
      error: 'Access denied. Only admins can download certificates.',
    }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  if (!username) {
    return NextResponse.json({ success: false, error: 'Username is required.' }, { status: 400 });
  }

  try {
    // Fetch student marks
    const [marksRows] = await db.query(
      'SELECT totalMarks FROM marks WHERE username = ?',
      [username]
    );
    const marksRow = marksRows[0];
    if (!marksRow || marksRow.totalMarks < 60) {
      return NextResponse.json({ success: false, error: 'Student not qualified for certificate.' }, { status: 403 });
    }

    // Fetch student registration details
    const [regRows] = await db.query(
      'SELECT name, branch, username, slot, mode, selectedDomain FROM registrations WHERE username = ?',
      [username]
    );
    const regRow = regRows[0];
    if (!regRow) {
      return NextResponse.json({ success: false, error: 'Student registration not found.' }, { status: 404 });
    }

    const { name, branch, username: idNumber, slot, mode, selectedDomain: domain } = regRow;
    const { totalMarks } = marksRow;
    const grade = getGrade(totalMarks);
    const { start, end } = getSlotDates(slot);

    // Load certificate template PDF
    const certPath = path.join(process.cwd(), 'public', 'certificate.pdf');
    const certBytes = fs.readFileSync(certPath);
    const pdfDoc = await PDFDocument.load(certBytes);

    // Register fontkit and load custom font
    pdfDoc.registerFontkit(fontkit);
    const fontBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Poppins-SemiBold.ttf'));
    const font = await pdfDoc.embedFont(fontBytes);

    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    // Always use server time for the certificate
    const date = new Date();
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const time = `${day}/${month}/${year}`;

    // console.log(time);

    // ✍️ Draw student details at appropriate positions
    drawCertificateFields(firstPage, {
      grade,
      name,
      branch,
      idNumber,
      start,
      end,
      slot,
      mode,
      domain,
      totalMarks,
      time,
      uid: `SI25${username}`
    }, font);

    const pdfBytes = await pdfDoc.save();

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${username}_certificate.pdf"`,
      },
    });
  } catch (err) {
    console.error('Error generating certificate:', err);
    return NextResponse.json({ success: false, error: 'Error generating certificate.' }, { status: 500 });
  }
}

export async function POST(request) {
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
      error: 'Access denied. Only admins can generate certificates.',
    }, { status: 403 });
  }

  try {
    const { slot } = await request.json();

    if (!slot) {
      return NextResponse.json(
        { success: false, error: 'Slot is required' },
        { status: 400 }
      );
    }

    // Get students with total marks >= 60 for the specified slot
    const [students] = await db.query(`
      SELECT 
        m.username,
        r.name,
        r.branch,
        r.year,
        r.slot,
        r.mode,
        r.selectedDomain,
        m.totalMarks,
        m.grade,
        m.completed
      FROM marks m
      JOIN registrations r ON m.username = r.username
      WHERE m.totalMarks >= 60 
      AND m.completed = 'P'
      AND r.slot = ?
      ORDER BY m.totalMarks DESC
    `, [slot]);

    if (students.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No eligible students found for Slot ${slot}`
      }, { status: 404 });
    }

    const generatedCertificates = [];

    for (const student of students) {
      try {
        // Check if certificate already exists
        const [existingCert] = await db.query(
          'SELECT * FROM certificates WHERE username = ?',
          [student.username]
        );

        if (existingCert.length > 0) {
          generatedCertificates.push({
            username: student.username,
            name: student.name,
            status: 'Already exists'
          });
          continue;
        }

        // Generate unique ID for the certificate
        const uid = `SI25${student.username}`;

        // Generate certificate using existing logic
        const { name, branch, username: idNumber, slot: studentSlot, mode, selectedDomain: domain } = student;
        const { totalMarks } = student;
        const grade = getGrade(totalMarks);
        const { start, end } = getSlotDates(studentSlot);

        // Load certificate template PDF
        const certPath = path.join(process.cwd(), 'public', 'certificate.pdf');
        const certBytes = fs.readFileSync(certPath);
        const pdfDoc = await PDFDocument.load(certBytes);

        // Register fontkit and load custom font
        pdfDoc.registerFontkit(fontkit);
        const fontBytes = fs.readFileSync(path.join(process.cwd(), 'public', 'fonts', 'Poppins-SemiBold.ttf'));
        const font = await pdfDoc.embedFont(fontBytes);

        const pages = pdfDoc.getPages();
        const firstPage = pages[0];
        
        // Always use server time for the certificate
        const date = new Date();
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const time = `${day}/${month}/${year}`;

        // Draw student details at appropriate positions
        drawCertificateFields(firstPage, {
          grade,
          name,
          branch,
          idNumber,
          start,
          end,
          slot: studentSlot,
          mode,
          domain,
          totalMarks,
          time,
          uid
        }, font);

        const pdfBytes = await pdfDoc.save();

        // Convert Uint8Array to Buffer for MySQL BLOB storage
        const pdfBuffer = Buffer.from(pdfBytes);

        // Save certificate info to database with PDF as BLOB
        await db.query(`
          INSERT INTO certificates (username, uid, pdf_data, slot, totalMarks)
          VALUES (?, ?, ?, ?, ?)
        `, [student.username, uid, pdfBuffer, studentSlot, totalMarks]);

        generatedCertificates.push({
          username: student.username,
          name: student.name,
          status: 'Generated',
          uid: uid
        });

      } catch (error) {
        console.error(`Error generating certificate for ${student.username}:`, error);
        generatedCertificates.push({
          username: student.username,
          name: student.name,
          status: 'Failed',
          error: error.message
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedCertificates.length} certificates for Slot ${slot}`,
      certificates: generatedCertificates
    });

  } catch (error) {
    console.error('Error generating certificates:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}