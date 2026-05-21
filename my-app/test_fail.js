import fs from 'fs';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import db from './src/lib/db.js';

function getShortBranch(branch) {
  if (!branch) return '';
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
    'civil engineering': 'CE',
    'civil': 'CE',
    'information technology': 'IT',
    'it': 'IT',
    'artificial intelligence and data science': 'AI&DS',
    'artificial intelligence & data science': 'AI&DS',
    'aids': 'AI&DS',
    'ai&ds': 'AI&DS',
    'bio-technology': 'BT',
    'biotechnology': 'BT',
    'computer science and information technology': 'CS&IT',
    'cs&it': 'CS&IT',
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

function getDisplayMode(m) {
  if (!m) return '';
  const upper = m.toUpperCase().trim();
  if (upper === 'ONLINE') return 'REMOTE';
  if (upper === 'OFFLINE') return 'IN-CAMPUS';
  return upper;
}

function drawCertificateFields(page, { grd, name, branch, idNumber, start, end, slot, mode, domain, totalMarks, grade, time, uid }, font) {
  const grdSize = 48;
  const grdW = font.widthOfTextAtSize(grd, grdSize);
  const grdCenterX = (995 + 1307) / 2;
  page.drawText(grd, { x: grdCenterX - (grdW / 2),  y: 2186.31, size: grdSize, font, color: rgb(0,0,0) });
  page.drawText(name, { x: 365, y: 2008.15, size: 34, font, color: rgb(0,0,0) });

  const shortBranch = getShortBranch(branch);
  const branchSize = 34; 
  const branchW = font.widthOfTextAtSize(shortBranch, branchSize);
  page.drawText(shortBranch, { x: 450 - (branchW / 2), y: 1962.85, size: branchSize, font, color: rgb(0,0,0) });

  page.drawText(idNumber, { x: 830,  y: 1962.85, size: 32, font, color: rgb(0,0,0) });

  const dateSize = 28;
  const startW = font.widthOfTextAtSize(start, dateSize);
  const startCenterX = (771 + 945) / 2;
  page.drawText(start, { x: startCenterX - (startW / 2), y: 1781.65, size: dateSize, font, color: rgb(0,0,0) });

  page.drawText(`${end},`, { x: 985, y: 1781.65, size: dateSize, font, color: rgb(0,0,0) });

  page.drawText(`${slot}`, { x: 740, y: 1736.35, size: 34, font, color: rgb(0,0,0) });

  const displayMode = getDisplayMode(mode);
  const modeSize = 28; 
  const modeW = font.widthOfTextAtSize(displayMode, modeSize);
  page.drawText(displayMode, { x: 430 - (modeW / 2), y: 1691.05, size: modeSize, font, color: rgb(0,0,0) }); 

  page.drawText(`${domain}.`, { x: 510, y: 1645.76, size: 32, font, color: rgb(0,0,0) });

  const marksStr = `${totalMarks}`;
  const marksSize = 34;
  page.drawText(marksStr, { x: 475, y: 649.18, size: marksSize, font, color: rgb(0,0,0) }); 

  page.drawText(grade, { x: 320, y: 603.88, size: 34, font, color: rgb(0,0,0) });
  page.drawText(time, { x: 1490, y: 157.89, size: 26, font, color: rgb(0,0,0) });
  page.drawText(uid, { x: 1470, y: 124.29, size: 26, font, color: rgb(0,0,0) });
}

async function testGen() {
    try {
        const username = '2500030057';
        
        const [regRows] = await db.query(
          'SELECT name, branch, username, slot, mode, selectedDomain FROM registrations WHERE username = ?',
          [username]
        );
        const regRow = regRows[0];
        console.log('Reg row:', regRow);
        
        if (!regRow) {
            console.log('No reg row found');
            return;
        }

        const certPath = './public/certificate.pdf';
        const certBytes = fs.readFileSync(certPath);
        const pdfDoc = await PDFDocument.load(certBytes);
        
        pdfDoc.registerFontkit(fontkit);
        const fontBytes = fs.readFileSync('./public/fonts/Poppins-SemiBold.ttf');
        const font = await pdfDoc.embedFont(fontBytes);
        
        const page = pdfDoc.getPages()[0];
        
        drawCertificateFields(page, {
            grd: 'Appreciation',
            name: regRow.name || '',
            branch: regRow.branch || '',
            idNumber: regRow.username || '',
            start: '11/05/2026',
            end: '17/05/2026',
            slot: regRow.slot || '',
            mode: regRow.mode || '',
            domain: regRow.selectedDomain || '',
            totalMarks: 85,
            grade: 'B',
            time: '20/05/2026',
            uid: 'SI262500012345'
        }, font);
        
        console.log('Success drawing fields');
        process.exit(0);
    } catch (e) {
        console.error('Error caught:', e);
        process.exit(1);
    }
}

testGen();
