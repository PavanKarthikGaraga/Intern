const fs = require('fs');
const filePath = 'src/app/api/dashboard/admin/dev/full-rep/route.js';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes('import IndiaMap from')) {
    content = content.replace("import db from", "import IndiaMap from '@/lib/indiaMap';\nimport db from");
}

// 2. Replace Pie Chart logic with SVG logic
const oldPieLogic = /const chartLabels = stateRows\.map[\s\S]*?\} catch\(e\) \{[\s\S]*?pieChartBase64 = pieChartUrl; \/\/ fallback\n    \}/;

const newSvgLogic = `
    const maxCount = Math.max(...stateRows.map(s => s.count), 1);
    const getStateColor = (count) => {
        const ratio = count / maxCount;
        const r = Math.round(235 - ratio * (235 - 43));
        const g = Math.round(248 - ratio * (248 - 108));
        const b = Math.round(255 - ratio * (255 - 176));
        return \`rgb(\${r}, \${g}, \${b})\`;
    };

    const stateMap = {};
    stateRows.forEach(row => {
        stateMap[row.state.trim().toLowerCase()] = row.count;
    });

    const svgPaths = IndiaMap.locations.map(loc => {
        const count = stateMap[loc.name.toLowerCase()] || 0;
        const fill = count > 0 ? getStateColor(count) : '#EDF2F7';
        return \`<path d="\${loc.path}" id="\${loc.id}" name="\${loc.name}" fill="\${fill}" stroke="#CBD5E0" stroke-width="2"></path>\`;
    }).join('\\n');

    const indiaSvgHtml = \`
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="\${IndiaMap.viewBox}" style="width: 100%; max-width: 500px; height: auto; display: block; margin: 0 auto;">
        \${svgPaths}
      </svg>
    \`;
`;

content = content.replace(oldPieLogic, newSvgLogic);

// 3. Replace pieChartBase64 img with indiaSvgHtml
const oldImgTag = /<img src="\$\{pieChartBase64\}" style="width: 500px; height: auto;" alt="State-wise Registrations" \/>/;
const newSvgTag = `\${indiaSvgHtml}`;

content = content.replace(oldImgTag, newSvgTag);

fs.writeFileSync(filePath, content);
console.log('Successfully updated route to use India SVG map!');
