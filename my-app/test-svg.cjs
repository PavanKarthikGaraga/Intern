const fs = require('fs');
const filePath = 'src/app/api/dashboard/admin/dev/full-rep/route.js';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the `<svg> ... </svg>` part with an `<img>` tag using base64.
// In the route.js we have:
// const indiaSvgHtml = `
//   <svg xmlns="http://www.w3.org/2000/svg" viewBox="${IndiaMap.viewBox}" style="width: 100%; max-width: 500px; height: auto; display: block; margin: 0 auto;">
//     ${svgPaths}
//   </svg>
// `;

const oldSvgHtmlStr = "const indiaSvgHtml = `\n      <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"${IndiaMap.viewBox}\" style=\"width: 100%; max-width: 500px; height: auto; display: block; margin: 0 auto;\">\n        ${svgPaths}\n      </svg>\n    `;";

const newSvgHtmlStr = `
    const rawSvg = \`<svg xmlns="http://www.w3.org/2000/svg" viewBox="\${IndiaMap.viewBox}" width="500" height="500">
        \${svgPaths}
      </svg>\`;
    const svgBase64 = Buffer.from(rawSvg).toString('base64');
    const indiaSvgHtml = \`
      <div style="text-align: center;">
        <img src="data:image/svg+xml;base64,\${svgBase64}" style="width: 500px; height: 500px;" alt="India Map" />
      </div>
    \`;
`;

if (content.includes('const indiaSvgHtml = `\n      <svg')) {
    content = content.replace(oldSvgHtmlStr, newSvgHtmlStr);
    fs.writeFileSync(filePath, content);
    console.log("Successfully replaced SVG with base64 img tag.");
} else {
    console.log("Could not find the exact SVG string to replace.");
}
