const fs = require('fs');
const filePath = 'src/app/api/dashboard/admin/dev/full-rep/route.js';
let content = fs.readFileSync(filePath, 'utf8');

const regex = /\/\/ 2\. States Involved Section[\s\S]*?\/\/ 3\. State-wise Photos/;

const replacement = `
    // 2. States Involved Section
    
    let legendHtml = \`<table style="width:100%; border-collapse: collapse; font-size: 14px;">
      <tr><th style="text-align:left; border-bottom:1px solid #CBD5E0; padding: 5px;">State</th><th style="text-align:right; border-bottom:1px solid #CBD5E0; padding: 5px;">Students</th></tr>\`;
    
    stateRows.forEach(row => {
        const count = row.count;
        const color = count > 0 ? getStateColor(count) : '#EDF2F7';
        legendHtml += \`<tr>
            <td style="padding: 5px; border-bottom:1px solid #EDF2F7;">
              <span style="display:inline-block; width:12px; height:12px; background-color:\${color}; margin-right:8px; border:1px solid #CBD5E0;"></span>\${row.state}
            </td>
            <td style="padding: 5px; border-bottom:1px solid #EDF2F7; text-align:right;"><b>\${count}</b></td>
        </tr>\`;
    });
    legendHtml += \`</table>\`;

    galleryHtml += \`
        <br clear="all" style="page-break-before:always; mso-break-type:page-break" />
        <h3 class="section-header">States Involved in the Social Internship</h3>
        
        <table style="width: 100%; margin: 30px 0;">
          <tr>
            <td style="width: 60%; text-align: center; vertical-align: top;">
              \${indiaSvgHtml}
            </td>
            <td style="width: 40%; vertical-align: top; padding-left: 20px; background-color: #F7FAFC; border: 1px solid #E2E8F0; padding: 15px;">
              <h4 style="margin-top:0; color: #2D3748; border-bottom: 2px solid #E2E8F0; padding-bottom: 10px;">Registrations by State</h4>
              \${legendHtml}
            </td>
          </tr>
        </table>
    \`;

    // 3. State-wise Photos
`;

if (regex.test(content)) {
    content = content.replace(regex, replacement);
    fs.writeFileSync(filePath, content);
    console.log("Successfully added map legend.");
} else {
    console.log("Could not find section to replace.");
}
