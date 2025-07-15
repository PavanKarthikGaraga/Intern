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

function getgrd(totalMarks){
  if(totalMarks>=90) return 'Excellence';
  if(totalMarks>=75) return 'Appreciation';
  if(totalMarks>=60) return 'Participation';
  return 'Fail';
}

// Helper to draw certificate fields at the correct positions
export function drawCertificateFields(page, { grd, name, branch, idNumber, start, end, slot, mode, domain, totalMarks,grade, time, uid }, font) {
  page.drawText(grd, { x: 340.29, y: 701.27, size: 16, font, color: rgb(0, 0, 0) });
  page.drawText(name, {  x: 90.35, y: 637.49, size: 11, font, color: rgb(0, 0, 0) });
  page.drawText(branch, { x: 103.27, y: 622.49, size: 11, font, color: rgb(0, 0, 0) });
  page.drawText(`${idNumber},`, { x: 282.2, y: 622.49, size: 11, font, color: rgb(0, 0, 0) });
  page.drawText(start, {x: 239.66, y: 562.46, size: 10, font, color: rgb(0, 0, 0) });
  page.drawText(`${end},`, { x: 316.73, y: 562.46, size: 10, font, color: rgb(0, 0, 0) });
  page.drawText(`${slot} ,`, { x: 228.94, y: 547.46, size: 11, font, color: rgb(0, 0, 0) });
  page.drawText(`${mode}`, { x: 92.82, y: 532.45  , size: 11, font, color: rgb(0, 0, 0) });
  page.drawText(`${domain}.`, { x: 144.93, y: 517.44 , size: 11, font, color: rgb(0, 0, 0) });
  page.drawText(`${totalMarks}`, {  x: 133.51, y: 262.33, size: 11, font, color: rgb(0, 0, 0) });
  page.drawText(grade, {  x: 88.32, y: 247.33 , size: 11, font, color: rgb(0, 0, 0) });
  page.drawText(time, {  x: 438.18, y: 98.01 , size: 10, font, color: rgb(0, 0, 0) });
  page.drawText(uid, {  x: 431.13, y: 83.01 , size: 10, font, color: rgb(0, 0, 0) });
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

    const grd=getgrd(totalMarks);

    // console.log(time);

    // ✍️ Draw student details at appropriate positions
    drawCertificateFields(firstPage, {
      grd,
      name,
      branch,
      idNumber,
      start,
      end,
      slot,
      mode,
      domain,
      totalMarks,
      grade,
      time,
      uid: `SI25${username}`,
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
    const { slot, batchSize = 50 } = await request.json();

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
        m.internalMarks,
        m.finalReport,
        m.finalPresentation,
        m.grade,
        m.completed,
        (m.internalMarks + m.finalReport + m.finalPresentation) as totalMarks
      FROM marks m
      JOIN registrations r ON m.username = r.username
      WHERE m.internalMarks + m.finalReport + m.finalPresentation >= 60 
      AND m.completed = 'P'
      AND r.slot = ?
      ORDER BY (m.internalMarks + m.finalReport + m.finalPresentation) DESC
    `, [slot]);

    if (students.length === 0) {
      return NextResponse.json({
        success: false,
        error: `No eligible students found for Slot ${slot}`
      }, { status: 404 });
    }

    // Check for existing certificates for these students
    const studentUsernames = students.map(s => s.username);
    const [existingCerts] = await db.query(`
      SELECT username, uid, slot, totalMarks FROM certificates 
      WHERE username IN (${studentUsernames.map(() => '?').join(',')})
    `, studentUsernames);

    // Separate students who need certificates from those who already have them
    const existingUsernames = existingCerts.map(cert => cert.username);
    const studentsToGenerate = students.filter(student => !existingUsernames.includes(student.username));
    const studentsWithExistingCerts = students.filter(student => existingUsernames.includes(student.username));

    // Get existing certificate details for display
    const existingCertificates = existingCerts.map(cert => {
      const student = students.find(s => s.username === cert.username);
      return {
        username: cert.username,
        name: student?.name || 'Unknown',
        uid: cert.uid,
        status: 'Already exists',
        totalMarks: cert.totalMarks,
        slot: cert.slot
      };
    });

    const generatedCertificates = [];
    let successCount = 0;
    let failureCount = 0;

    // Process certificates in batches
    const totalBatches = Math.ceil(studentsToGenerate.length / batchSize);

    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, studentsToGenerate.length);
      const currentBatch = studentsToGenerate.slice(startIndex, endIndex);

      console.log(`Processing batch ${batchIndex + 1}/${totalBatches} (${currentBatch.length} certificates)`);

      // Send progress update
      if (global.certificateProgress) {
        global.certificateProgress(batchIndex + 1, totalBatches);
      }

      // Process each student in the current batch
      for (const student of currentBatch) {
        try {
          // Generate unique ID for the certificate
          const uid = `SI25${student.username}`;

          // Generate certificate using existing logic
          const { name, branch, username: idNumber, slot: studentSlot, mode, selectedDomain: domain } = student;
          const totalMarks = Number(student.totalMarks);
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
            slot: studentSlot,
            mode,
            domain,
            totalMarks,
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
          `, [student.username, uid, pdfBuffer, studentSlot, totalMarks]);

          generatedCertificates.push({
            username: student.username,
            name: student.name,
            status: 'Generated',
            uid: uid,
            totalMarks: totalMarks,
            grade: grade
          });

          successCount++;

        } catch (error) {
          console.error(`Error generating certificate for ${student.username}:`, error);
          generatedCertificates.push({
            username: student.username,
            name: student.name,
            status: 'Failed',
            error: error.message
          });
          failureCount++;
        }
      }

      // Add a small delay between batches to prevent overwhelming the system
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Combine existing and newly generated certificates
    const allCertificates = [...existingCertificates, ...generatedCertificates];

    // Create comprehensive summary
    const summary = {
      totalStudents: students.length,
      existingCount: existingCertificates.length,
      newlyGeneratedCount: successCount,
      failedCount: failureCount,
      slot: slot,
      studentsNeedingCertificates: studentsToGenerate.length,
      studentsWithExistingCertificates: studentsWithExistingCerts.length,
      batchInfo: {
        totalBatches: totalBatches,
        batchSize: batchSize,
        processedBatches: totalBatches
      }
    };

    // Determine message based on what happened
    let message = '';
    if (existingCertificates.length > 0 && successCount > 0) {
      message = `Found ${existingCertificates.length} existing certificates for Slot ${slot}. Generated ${successCount} new certificates in ${totalBatches} batches.`;
    } else if (existingCertificates.length > 0 && successCount === 0) {
      message = `All eligible students for Slot ${slot} already have certificates (${existingCertificates.length} total).`;
    } else if (existingCertificates.length === 0 && successCount > 0) {
      message = `Generated ${successCount} certificates for Slot ${slot} in ${totalBatches} batches${failureCount > 0 ? `, ${failureCount} failed` : ''}`;
    }

    return NextResponse.json({
      success: true,
      message: message,
      summary: summary,
      certificates: allCertificates,
      existingCertificates: existingCertificates,
      newlyGeneratedCertificates: generatedCertificates,
      currentBatch: totalBatches,
      totalBatches: totalBatches
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

export async function DELETE(req) {
  try {
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
        error: 'Access denied. Only admins can delete certificates.',
      }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');
    
    if (!username) {
      return NextResponse.json({ 
        success: false, 
        error: 'Username is required.' 
      }, { status: 400 });
    }

    // Check if certificate exists
    const [existingCert] = await db.query(
      'SELECT * FROM certificates WHERE username = ?',
      [username]
    );

    if (!existingCert || existingCert.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Certificate not found.' 
      }, { status: 404 });
    }

    // Delete the certificate
    await db.query(
      'DELETE FROM certificates WHERE username = ?',
      [username]
    );

    return NextResponse.json({
      success: true,
      message: `Certificate for ${username} deleted successfully.`
    });

  } catch (error) {
    console.error('Error deleting certificate:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Error deleting certificate.' 
    }, { status: 500 });
  }
}
