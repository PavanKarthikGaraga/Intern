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
    case 1: return { start: '11/05/2026', end: '17/05/2026' };
    case 2: return { start: '18/05/2026', end: '24/05/2026' };
    case 3: return { start: '25/05/2026', end: '31/05/2026' };
    case 4: return { start: '01/06/2026', end: '07/06/2026' };
    case 5: return { start: '08/06/2026', end: '14/06/2026' };
    case 6: return { start: '15/06/2026', end: '21/06/2026' };
    case 7: return { start: '22/06/2026', end: '28/06/2026' };
    case 8: return { start: '29/06/2026', end: '05/07/2026' };
    case 9: return { start: '06/07/2026', end: '12/07/2026' };
    default: return { start: '', end: '' };
  }
}

function getgrd(totalMarks){
  if(totalMarks>=90) return 'Excellence';
  if(totalMarks>=75) return 'Appreciation';
  if(totalMarks>=60) return 'Participation';
  return 'Fail';
}

// Draw certificate fields — positions from precise Poppins font measurements
// Blank spaces (pt): grd:227, branch:499, mode:154, startDate:~175
export function drawCertificateFields(page, { grd, name, branch, idNumber, start, end, slot, mode, domain, totalMarks, grade, time, uid }, font) {
  // 1. Grade word — centered in 227pt blank between x:1080 and x:1307
  const grdW = font.widthOfTextAtSize(grd, 34);
  const grdX = 1080 + Math.max(0, (227 - grdW) / 2);
  page.drawText(grd,            { x: grdX,  y: 2186.31, size: 34, font, color: rgb(0,0,0) });

  // 2. Name — after "Mr./Ms." ends at x:415.53
  page.drawText(name,           { x: 420,   y: 1991.95, size: 34, font, color: rgb(0,0,0) });

  // 3. Branch — after "of Branch" ends at x:455.95  (max 499pt → use 24pt)
  page.drawText(branch,         { x: 460,   y: 1948.53, size: 24, font, color: rgb(0,0,0) });

  // 4. Student ID — after "bearing Student ID" ends at x:1298.04
  page.drawText(idNumber,       { x: 1302,  y: 1948.53, size: 32, font, color: rgb(0,0,0) });

  // 5. Start date — placed at x:714 (inside blank underline before "to" at x:906), size 26pt
  page.drawText(start,          { x: 714,   y: 1774.85, size: 26, font, color: rgb(0,0,0) });

  // 6. End date — after "to" ends at x:943.68
  page.drawText(`${end},`,      { x: 950,   y: 1774.85, size: 30, font, color: rgb(0,0,0) });

  // 7. Slot — after "for a period of 7 days, in Slot No" ends at x:850.60
  page.drawText(`${slot}`,      { x: 858,   y: 1731.43, size: 34, font, color: rgb(0,0,0) });

  // 8. Mode — between "through" end (x:427.76) and "mode," start (x:581.99) = 154pt gap
  page.drawText(mode,           { x: 432,   y: 1688.01, size: 30, font, color: rgb(0,0,0) });

  // 9. Domain — after "under the domain" ends at x:610.58 (use 24pt for long domain names)
  page.drawText(`${domain}.`,   { x: 618,   y: 1644.58, size: 24, font, color: rgb(0,0,0) });

  // 10. Marks — after "Marks Awarded:" ends at x:577.37, before "/ 100" at x:599.51
  page.drawText(`${totalMarks}`, { x: 580,  y: 689.34,  size: 28, font, color: rgb(0,0,0) });

  // 11. Grade letter — after "Grade:" ends at x:403.05
  page.drawText(grade,          { x: 407,   y: 645.91,  size: 34, font, color: rgb(0,0,0) });

  // 12. Certificate Date — after "Certificate Date:" ends at x:1508.05
  page.drawText(time,           { x: 1512,  y: 157.89,  size: 26, font, color: rgb(0,0,0) });

  // 13. Certificate No — after "Certificate No:" ends at x:1479.30
  page.drawText(uid,            { x: 1483,  y: 124.29,  size: 26, font, color: rgb(0,0,0) });
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
          const grd = getgrd(totalMarks);
          drawCertificateFields(firstPage, {
            grd,
            name,
            branch,
            idNumber,
            start,
            end,
            slot: studentSlot,
            mode,
            domain,
            totalMarks,
            grade,
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
