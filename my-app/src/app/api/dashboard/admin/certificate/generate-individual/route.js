import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import db from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

// Helper to convert marks to grade
function getGrade(marks) {
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
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { success: false, error: 'Username is required' },
        { status: 400 }
      );
    }

    // Check if certificate already exists
    const [existingCert] = await db.query(
      'SELECT * FROM certificates WHERE username = ?',
      [username]
    );

    if (existingCert.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Certificate for ${username} already exists.`,
        uid: existingCert[0].uid,
        totalMarks: Number(existingCert[0].totalMarks) || 0
      }, { status: 409 });
    }

    // Fetch student marks
    const [marksRows] = await db.query(
      'SELECT internalMarks, finalReport, finalPresentation, completed, (internalMarks + finalReport + finalPresentation) as totalMarks FROM marks WHERE username = ?',
      [username]
    );
    const marksRow = marksRows[0];
    if (!marksRow || Number(marksRow.totalMarks) < 60) {
      return NextResponse.json({ 
        success: false, 
        error: `Student ${username} is not qualified for certificate (marks: ${marksRow?.totalMarks || 0})` 
      }, { status: 403 });
    }

    // Fetch student registration details
    const [regRows] = await db.query(
      'SELECT name, branch, username, slot, mode, selectedDomain FROM registrations WHERE username = ?',
      [username]
    );
    const regRow = regRows[0];
    if (!regRow) {
      return NextResponse.json({ 
        success: false, 
        error: `Student registration not found for ${username}` 
      }, { status: 404 });
    }

    const { name, branch, username: idNumber, slot, mode, selectedDomain: domain } = regRow;
    const totalMarks = Number(marksRow.totalMarks);
    const grade = getGrade(totalMarks);
    const { start, end } = getSlotDates(slot);

    // Generate unique ID for the certificate
    const uid = `SI25${username}`;

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
    
    // Always use IST (Asia/Kolkata) time for the certificate
    const date = new Date();
    const options = {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };
    const [day, month, year] = new Intl.DateTimeFormat('en-GB', options)
      .format(date)
      .split('/');
    const time = `${day}/${month}/${year}`;

    // Draw student details at appropriate positions
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
      totalMarks: Number(totalMarks) || 0,
      time,
      uid,
    }, font);

    const pdfBytes = await pdfDoc.save();

    // Convert Uint8Array to Buffer for MySQL BLOB storage
    const pdfBuffer = Buffer.from(pdfBytes);

    // Save certificate info to database with PDF as BLOB
    await db.query(`
      INSERT INTO certificates (username, uid, pdf_data, slot, totalMarks)
      VALUES (?, ?, ?, ?, ?)
    `, [username, uid, pdfBuffer, slot, totalMarks]);

    return NextResponse.json({
      success: true,
      message: `Certificate generated successfully for ${username}`,
      uid: uid,
      totalMarks: totalMarks,
      grade: grade,
      name: name
    });

  } catch (error) {
    console.error('Error generating individual certificate:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
} 