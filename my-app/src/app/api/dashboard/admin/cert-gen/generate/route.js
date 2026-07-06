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

function getgrd(totalMarks){
  if(totalMarks>=90) return 'Excellence';
  if(totalMarks>=75) return 'Appreciation';
  if(totalMarks>=60) return 'Participation';
  return 'Fail';
}

// Helper to get slot dates
function getSlotDates(slot, season = '2026') {
  const year = season === '2025' ? '2025' : '2026';
  switch (Number(slot)) {
    case 1: return { start: `11/05/${year}`, end: `17/05/${year}` };
    case 2: return { start: `18/05/${year}`, end: `24/05/${year}` };
    case 3: return { start: `25/05/${year}`, end: `31/05/${year}` };
    case 4: return { start: `01/06/${year}`, end: `07/06/${year}` };
    case 5: return { start: `08/06/${year}`, end: `14/06/${year}` };
    case 6: return { start: `15/06/${year}`, end: `21/06/${year}` };
    case 7: return { start: `22/06/${year}`, end: `28/06/${year}` };
    case 8: return { start: `29/06/${year}`, end: `05/07/${year}` };
    case 9: return { start: `06/07/${year}`, end: `12/07/${year}` };
    default: return { start: '', end: '' };
  }
}

// Helper to get short branch name
function getShortBranch(branch) {
  if (!branch) return '';
  
  // Strip common prefixes
  let b = branch.toLowerCase().trim();
  b = b.replace(/^(b\.?tech|b\.?e\.?|bachelor of technology|bachelor of engineering)[\s-x]*/i, '').trim();
  
  const map = {
    'computer science and engineering': 'CSE',
    'computer science & engineering': 'CSE',
    'computer science': 'CSE',
    'cse': 'CSE',
    'electronics and communication engineering': 'ECE',
    'electronics & communication engineering': 'ECE',
    'ece': 'ECE',
    'electrical and electronics engineering': 'EEE',
    'electrical & electronics engineering': 'EEE',
    'eee': 'EEE',
    'mechanical engineering': 'ME',
    'mech': 'ME',
    'me': 'ME',
    'civil engineering': 'CE',
    'civil': 'CE',
    'ce': 'CE',
    'information technology': 'IT',
    'it': 'IT',
    'artificial intelligence and data science': 'AI&DS',
    'artificial intelligence & data science': 'AI&DS',
    'aids': 'AI&DS',
    'ai&ds': 'AI&DS',
    'bio-technology': 'BT',
    'biotechnology': 'BT',
    'bt': 'BT',
    'artificial intelligence': 'AI',
    'ai': 'AI',
    'computer science and information technology': 'CS&IT',
    'cs&it': 'CS&IT',
    'csit': 'CS&IT',
    'electronics and computer engineering': 'ECS',
    'ecs': 'ECS',
    'internet of things': 'IOT',
    'iot': 'IOT'
  };
  
  let result = map[b];
  if (!result) {
    const words = b.split(/[\s&]+/).filter(w => !['and', 'of', 'the', 'in'].includes(w));
    if (words.length > 1) {
      result = words.map(w => w[0]?.toUpperCase()).join('');
    } else {
      result = branch.length > 15 ? branch.substring(0, 15) : branch;
    }
  }
  
  return result;
}

// Helper to get formatted mode
function getDisplayMode(m) {
  if (!m) return '';
  const upper = m.toUpperCase().trim();
  if (upper === 'ONLINE') return 'REMOTE';
  if (upper === 'OFFLINE') return 'IN-CAMPUS';
  return upper;
}

// Draw certificate fields — positions from precise Poppins font measurements
function drawCertificateFields(page, { grd, name, branch, idNumber, start, end, slot, mode, domain, totalMarks, grade, time, uid }, font) {
  // 1. Grade word
  const grdSize = 48;
  const grdW = font.widthOfTextAtSize(grd, grdSize);
  const grdCenterX = (995 + 1307) / 2;
  page.drawText(grd,            { x: grdCenterX - (grdW / 2),  y: 2186.31, size: grdSize, font, color: rgb(0,0,0) });

  // 2. Name — after "Mr./Ms." starts at 216.
  page.drawText(name,           { x: 365,   y: 2008.15, size: 34, font, color: rgb(0,0,0) });

  // 3. Branch — dynamically centered around x=450 to prevent overlap
  const shortBranch = getShortBranch(branch);
  const branchSize = 34; // All branches are now abbreviations, use large font
  const branchW = font.widthOfTextAtSize(shortBranch, branchSize);
  page.drawText(shortBranch,    { x: 450 - (branchW / 2), y: 1962.85, size: branchSize, font, color: rgb(0,0,0) });

  // 4. Student ID — after "Student ID" at x:783
  page.drawText(idNumber,       { x: 830,  y: 1962.85, size: 32, font, color: rgb(0,0,0) });

  // 5. Start date — Centered between "from" (~771) and "to" (945)
  const dateSize = 28;
  const startW = font.widthOfTextAtSize(start, dateSize);
  const startCenterX = (771 + 945) / 2;
  page.drawText(start,          { x: startCenterX - (startW / 2),   y: 1781.65, size: dateSize, font, color: rgb(0,0,0) });

  // 6. End date — "to" ends at ~970
  page.drawText(`${end},`,      { x: 985,   y: 1781.65, size: dateSize, font, color: rgb(0,0,0) });

  // 7. Slot — after "Slot No" at 684
  page.drawText(`${slot}`,      { x: 740,   y: 1736.35, size: 34, font, color: rgb(0,0,0) });

  // 8. Mode — dynamically centered around x=430 to fix IN-CAMPUS overlap
  const displayMode = getDisplayMode(mode);
  const modeSize = 28; 
  const modeW = font.widthOfTextAtSize(displayMode, modeSize);
  page.drawText(displayMode,    { x: 430 - (modeW / 2), y: 1691.05, size: modeSize, font, color: rgb(0,0,0) }); 

  // 9. Domain — after "domain" at 392.
  page.drawText(`${domain}.`,   { x: 510,   y: 1645.76, size: 32, font, color: rgb(0,0,0) });

  // 10. Marks — Left-aligned at 475 (shifted slightly left)
  const marksStr = `${totalMarks}`;
  const marksSize = 34;
  page.drawText(marksStr,       { x: 475, y: 649.18, size: marksSize, font, color: rgb(0,0,0) }); 

  // 11. Grade letter — after "Grade:" at 216
  page.drawText(grade,          { x: 320,   y: 603.88,  size: 34, font, color: rgb(0,0,0) });

  // 12. Certificate Date — after "Date:" at 1413
  page.drawText(time,           { x: 1490,  y: 157.89,  size: 26, font, color: rgb(0,0,0) });

  // 13. Certificate No — after "No:" at 1414
  page.drawText(uid,            { x: 1470,  y: 124.29,  size: 26, font, color: rgb(0,0,0) });
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
      error: 'Access denied. Only admins can generate certificates manually.',
    }, { status: 403 });
  }

  try {
    const { username, manualMarks } = await request.json();

    if (!username || manualMarks === undefined) {
      return NextResponse.json(
        { success: false, error: 'Username and manual marks are required' },
        { status: 400 }
      );
    }

    // Fetch student registration details
    const [regRows] = await db.query(
      'SELECT name, branch, username, slot, mode, selectedDomain, season FROM registrations WHERE username = ?',
      [username]
    );
    const regRow = regRows[0];
    if (!regRow) {
      return NextResponse.json({ 
        success: false, 
        error: `Student registration not found for ${username}` 
      }, { status: 404 });
    }

    const { name, branch, username: idNumber, slot, mode, selectedDomain: domain, season } = regRow;
    const totalMarks = Number(manualMarks);
    const grade = getGrade(totalMarks);
    const { start, end } = getSlotDates(slot, season);
    const grd = getgrd(totalMarks);
    const uid = `SI26${username}`;

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
    const [day, month, currentYear] = new Intl.DateTimeFormat('en-GB', options)
      .format(date)
      .split('/');
    const time = `${day}/${month}/${currentYear}`;

    // Draw student details at appropriate positions
    drawCertificateFields(firstPage, {
      grd: grd || '',
      grade: grade || '',
      name: name || '',
      branch: branch || '',
      idNumber: idNumber || '',
      start: start || '',
      end: end || '',
      slot: slot || '',
      mode: mode || '',
      domain: domain || '',
      totalMarks: Number(totalMarks) || 0,
      time: time || '',
      uid: uid || '',
    }, font);

    const pdfBytes = await pdfDoc.save();

    // Convert Uint8Array to Buffer for MySQL BLOB storage
    const pdfBuffer = Buffer.from(pdfBytes);

    // Caps totalMarks to 99.99 for database entry to prevent DECIMAL(4,2) overflow
    const dbTotalMarks = Math.min(Number(totalMarks) || 0, 99.99);

    // Save certificate info to database, overwrite if exists
    await db.query(`
      INSERT INTO certificates (username, uid, pdf_data, slot, totalMarks)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      pdf_data = VALUES(pdf_data), 
      totalMarks = VALUES(totalMarks),
      slot = VALUES(slot)
    `, [username, uid, pdfBuffer, slot, dbTotalMarks]);

    return NextResponse.json({
      success: true,
      message: `Manual Certificate generated successfully for ${username}`,
      uid: uid,
      totalMarks: totalMarks,
      grade: grade,
      name: name
    });

  } catch (error) {
    console.error('Error generating manual certificate:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error while generating certificate' 
      },
      { status: 500 }
    );
  }
}
