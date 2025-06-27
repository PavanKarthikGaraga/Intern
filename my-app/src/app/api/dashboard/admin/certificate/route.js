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
    
    let time;
    try {
      const res = await fetch("https://timeapi.io/api/Time/current/zone?timeZone=Asia/Kolkata");
      const data = await res.json();
    
      // Convert MM/DD/YYYY to DD/MM/YYYY
      const [month, day, year] = data.date.split('/');
      time = `${day}/${month}/${year}`;
    } catch (err) {
      console.error("Failed to fetch accurate time, using server time:", err);
    
      const date = new Date();
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is 0-indexed
      const year = date.getFullYear();
    
      time = `${day}/${month}/${year}`;
    }
    

    console.log(time);


    // ✍️ Draw student details at appropriate positions
    firstPage.drawText(grade, { x: 375.09, y: 668.7, size: 16, font, color: rgb(0, 0, 0) });
    firstPage.drawText(name, {  x: 96.04, y: 604.92, size: 12, font, color: rgb(0, 0, 0) });
    firstPage.drawText(branch, { x: 62.03, y: 589.91, size: 12, font, color: rgb(0, 0, 0) });
    firstPage.drawText(`${idNumber},`, { x: 250.17, y: 589.91, size: 12, font, color: rgb(0, 0, 0) });
    firstPage.drawText(start, {x: 237.78, y: 529.89, size: 10, font, color: rgb(0, 0, 0) });
    firstPage.drawText(`${end},`, { x: 320.53, y: 529.89, size: 10, font, color: rgb(0, 0, 0) });
    firstPage.drawText(`Slot ${slot},`, {  x: 188.41, y: 514.89, size: 12, font, color: rgb(0, 0, 0) });
    firstPage.drawText(`${mode}`, { x: 91.43, y: 499.88 , size: 12, font, color: rgb(0, 0, 0) });
    firstPage.drawText(`${domain}.`, { x: 146.33, y: 484.88 , size: 12, font, color: rgb(0, 0, 0) });
    firstPage.drawText(`${totalMarks}`, {  x: 133.51, y: 229.78, size: 12, font, color: rgb(0, 0, 0) });
    firstPage.drawText(grade, {  x: 87.12, y: 214.77 , size: 12, font, color: rgb(0, 0, 0) });
    firstPage.drawText(time, {  x: 467.22, y: 80.47 , size: 12, font, color: rgb(0, 0, 0) });
    firstPage.drawText(`SI25${username}`, {  x: 493.76, y: 65.47 , size: 10, font, color: rgb(0, 0, 0) });


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