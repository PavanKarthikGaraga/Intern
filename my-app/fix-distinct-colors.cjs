const fs = require('fs');
const filePath = 'src/app/api/dashboard/admin/dev/full-rep/route.js';
let content = fs.readFileSync(filePath, 'utf8');

// The logic to replace starts at `const maxCount = Math.max(...`
// and ends after the `legendHtml` loop.
// We will replace it safely.

const oldColorLogic = /const maxCount = Math\.max\(\.\.\.stateRows\.map[\s\S]*?const stateMap = \{\};\n    stateRows\.forEach\(row => \{\n        stateMap\[row\.state\.trim\(\)\.toLowerCase\(\)\] = row\.count;\n    \}\);/m;

const newColorLogic = `
    const distinctColors = [
        '#E53E3E', '#319795', '#D69E2E', '#805AD5', '#38A169', 
        '#3182CE', '#DD6B20', '#ED64A6', '#00B5D8', '#D53F8C', 
        '#4A5568', '#975A16', '#553C9A', '#2C7A7B', '#276749', 
        '#2B6CB0', '#C53030', '#B7791F', '#F6E05E', '#68D391',
        '#F6AD55', '#F687B3', '#76E4F7', '#B794F4', '#FC8181'
    ];

    const stateMap = {};
    const stateColorMap = {};
    let colorIdx = 0;

    stateRows.forEach(row => {
        const key = row.state.trim().toLowerCase();
        stateMap[key] = row.count;
        stateColorMap[key] = distinctColors[colorIdx % distinctColors.length];
        colorIdx++;
    });
`;

if (oldColorLogic.test(content)) {
    content = content.replace(oldColorLogic, newColorLogic);
} else {
    console.error("Could not find old color logic to replace.");
}

const oldSvgLoop = /const count = stateMap\[loc\.name\.toLowerCase\(\)\] \|\| 0;\n        const fill = count > 0 \? getStateColor\(count\) : '#EDF2F7';/;
const newSvgLoop = `const count = stateMap[loc.name.toLowerCase()] || 0;
        const fill = count > 0 ? stateColorMap[loc.name.toLowerCase()] : '#EDF2F7';`;

content = content.replace(oldSvgLoop, newSvgLoop);

const oldLegendLoop = /const count = row\.count;\n        const color = count > 0 \? getStateColor\(count\) : '#EDF2F7';/;
const newLegendLoop = `const count = row.count;
        const color = count > 0 ? stateColorMap[row.state.trim().toLowerCase()] : '#EDF2F7';`;

content = content.replace(oldLegendLoop, newLegendLoop);

fs.writeFileSync(filePath, content);
console.log("Successfully updated to distinct state colors.");
