const fs = require('fs');
const filePath = 'src/app/api/dashboard/admin/dev/full-rep/route.js';
let content = fs.readFileSync(filePath, 'utf8');

if (!content.includes("import sharp from 'sharp';")) {
    content = content.replace("import IndiaMap from", "import sharp from 'sharp';\nimport IndiaMap from");
}

const oldSvgBlock = /const rawSvg = [\s\S]*?alt="India Map" \/>\n      <\/div>\n    `;/;

const newSvgBlock = `
    const rawSvg = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="\${IndiaMap.viewBox}" width="500" height="500">
        \${svgPaths}
      </svg>\`;
      
    // Convert SVG to PNG Base64 using sharp so MS Word can render it
    let pngBase64 = "";
    try {
      const pngBuffer = await sharp(Buffer.from(rawSvg)).png().toBuffer();
      pngBase64 = pngBuffer.toString('base64');
    } catch (err) {
      console.error('Error generating map PNG:', err);
    }
    
    const indiaSvgHtml = \`
      <div style="text-align: center;">
        <img src="data:image/png;base64,\${pngBase64}" style="width: 500px; height: 500px;" alt="India Map" />
      </div>
    \`;
`;

content = content.replace(oldSvgBlock, newSvgBlock);
fs.writeFileSync(filePath, content);
console.log("Successfully updated route.js to convert SVG to PNG using sharp");
