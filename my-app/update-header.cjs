const fs = require('fs');
const filePath = 'src/app/api/dashboard/admin/dev/full-rep/route.js';
let content = fs.readFileSync(filePath, 'utf8');

// Add path module to imports if not there
if (!content.includes("import path from 'path';")) {
  content = content.replace("import pool from '@/lib/db';", "import pool from '@/lib/db';\nimport fs from 'fs';\nimport path from 'path';");
}

const getBase64Logic = `
    let sacLogoBase64 = '';
    try {
      const sacLogoPath = path.join(process.cwd(), 'public', 'sac.png');
      const sacLogoData = fs.readFileSync(sacLogoPath);
      sacLogoBase64 = 'data:image/png;base64,' + sacLogoData.toString('base64');
    } catch (e) {
      console.error('Error reading sac.png', e);
    }
`;

// Insert the base64 logic before const htmlContent = `
content = content.replace("const htmlContent = `", getBase64Logic + "\n    const htmlContent = `");

const newHeader = `
        <div class="header-title" style="border: none; margin-top: 50px;">
          <h1 style="font-size: 36pt; text-transform: uppercase; margin: 0; color: #2B6CB0; text-align: center;">STUDENT ACTIVITY CENTER<br/>(SAC)</h1>
          <h2 style="font-size: 24pt; margin: 20px 0; color: #4A5568; text-align: center;">Social Internship</h2>
          <p style="font-size: 18pt; color: #718096; font-style: italic; text-align: center;">Monthly Progress Report - May 2026</p>
          
          <div style="text-align: center; margin: 60px 0;">
            <img src="\${sacLogoBase64}" alt="SAC Logo" style="width: 250px; height: auto;" />
          </div>

          <table style="width: 100%; text-align: center; margin-top: 80px; font-size: 16pt; color: #4A5568;">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <b>Submitted by:</b><br/>Director-SAC<br/>Student Activity Center
              </td>
              <td style="width: 50%; vertical-align: top;">
                <b>Institution:</b><br/>KL Deemed to be University
              </td>
            </tr>
          </table>
        </div>
        
        <!-- MS Word Page Break -->
        <br clear="all" style="page-break-before:always; mso-break-type:page-break" />
`;

content = content.replace(/<div class="header-title">[\s\S]*?<\/div>/, newHeader);

fs.writeFileSync(filePath, content);
console.log('Successfully updated title page');
