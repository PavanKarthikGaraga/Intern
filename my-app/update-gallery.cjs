const fs = require('fs');
const filePath = 'src/app/api/dashboard/admin/dev/full-rep/route.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Insert State DB query and QuickChart fetch just before `const htmlContent = \``
const stateQueryLogic = `
    // 4. State-wise Registrations
    const [stateRows] = await pool.query(\`
      SELECT state, COUNT(*) as count 
      FROM registrations 
      WHERE state IS NOT NULL AND state != ''
      GROUP BY state 
      ORDER BY count DESC
    \`);

    const chartLabels = stateRows.map(s => s.state);
    const chartData = stateRows.map(s => s.count);
    const chartConfig = {
      type: 'pie',
      data: {
        labels: chartLabels,
        datasets: [{ data: chartData }]
      }
    };
    const pieChartUrl = 'https://quickchart.io/chart?c=' + encodeURIComponent(JSON.stringify(chartConfig)) + '&w=500&h=300';
    
    let pieChartBase64 = '';
    try {
        const pRes = await fetch(pieChartUrl);
        const pBuf = await pRes.arrayBuffer();
        pieChartBase64 = 'data:image/png;base64,' + Buffer.from(pBuf).toString('base64');
    } catch(e) {
        console.error('Quickchart fetch failed', e);
        pieChartBase64 = pieChartUrl; // fallback
    }

    let galleryHtml = '';
    
    // 1. Slot-wise Gallery (1 to 6)
    for (const row of slotRows) {
      const n = parseInt(row.slot, 10);
      if (n >= 1 && n <= 6) {
        galleryHtml += \`
          <h3 style="color: #2B6CB0; border-bottom: 2px solid #E2E8F0; padding-bottom: 5px; margin-top: 40px;">Slot \${n} Gallery</h3>
          <p>
            <b>Total Registered:</b> \${row.total} | 
            <b>Remote:</b> \${row.remote || 0} | 
            <b>In-Campus:</b> \${row.incampus || 0} | 
            <b>In-Village:</b> \${row.invillage || 0}
          </p>
          <table style="width: 100%; margin-top: 15px; border-spacing: 20px; border-collapse: separate;">
            <tr>
              <td style="width: 50%; padding: 0;">
                <div style="height: 200px; background-color: #EDF2F7; border: 2px dashed #A0AEC0; text-align: center; padding-top: 85px; color: #718096; font-weight: bold;">[ Slot \${n} Photo 1 ]</div>
              </td>
              <td style="width: 50%; padding: 0;">
                <div style="height: 200px; background-color: #EDF2F7; border: 2px dashed #A0AEC0; text-align: center; padding-top: 85px; color: #718096; font-weight: bold;">[ Slot \${n} Photo 2 ]</div>
              </td>
            </tr>
            <tr>
              <td style="width: 50%; padding: 0;">
                <div style="height: 200px; background-color: #EDF2F7; border: 2px dashed #A0AEC0; text-align: center; padding-top: 85px; color: #718096; font-weight: bold;">[ Slot \${n} Photo 3 ]</div>
              </td>
              <td style="width: 50%; padding: 0;">
                <div style="height: 200px; background-color: #EDF2F7; border: 2px dashed #A0AEC0; text-align: center; padding-top: 85px; color: #718096; font-weight: bold;">[ Slot \${n} Photo 4 ]</div>
              </td>
            </tr>
          </table>
        \`;
      }
    }

    // 2. States Involved Section
    galleryHtml += \`
        <br clear="all" style="page-break-before:always; mso-break-type:page-break" />
        <h3 class="section-header">States Involved in the Social Internship</h3>
        <div style="text-align: center; margin: 30px 0;">
          <img src="\${pieChartBase64}" style="width: 500px; height: auto;" alt="State-wise Registrations" />
        </div>
    \`;

    // 3. State-wise Photos
    for (const stateRow of stateRows) {
        galleryHtml += \`
          <h4 style="color: #2B6CB0; margin-top: 30px;">\${stateRow.state} (\${stateRow.count} Students)</h4>
          <table style="width: 100%; border-spacing: 20px; border-collapse: separate;">
            <tr>
              <td style="width: 50%; padding: 0;">
                <div style="height: 200px; background-color: #EDF2F7; border: 2px dashed #A0AEC0; text-align: center; padding-top: 85px; color: #718096; font-weight: bold;">[ \${stateRow.state} Photo 1 ]</div>
              </td>
              <td style="width: 50%; padding: 0;">
                <div style="height: 200px; background-color: #EDF2F7; border: 2px dashed #A0AEC0; text-align: center; padding-top: 85px; color: #718096; font-weight: bold;">[ \${stateRow.state} Photo 2 ]</div>
              </td>
            </tr>
          </table>
        \`;
    }

`;

content = content.replace("    const htmlContent = `", stateQueryLogic + "    const htmlContent = `");

// 2. Replace the old gallery HTML block
const oldGalleryRegex = /<h2 style="text-align: center; border: none;">Visual Evidence & Gallery<\/h2>[\s\S]*?<\/table>/;
const newGalleryPlaceholder = `
        <h2 style="text-align: center; border: none;">Visual Evidence & Gallery</h2>
        <p style="text-align: center; color: #718096;"><i>(High-resolution photographs of field activities and implementations)</i></p>
        
        \${galleryHtml}
`;

content = content.replace(oldGalleryRegex, newGalleryPlaceholder);

fs.writeFileSync(filePath, content);
console.log('Successfully updated gallery section');
