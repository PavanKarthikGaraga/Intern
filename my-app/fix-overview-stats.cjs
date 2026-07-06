const fs = require('fs');
const filePath = 'src/app/api/dashboard/admin/overview/route.js';
let content = fs.readFileSync(filePath, 'utf8');

const MARKS_SUBQUERY_JS = `
    const MARKS_SUBQUERY = \`
      (
        SELECT 
          r.username,
          r.slot,
          CASE 
            WHEN r.slot = 1 THEN (COALESCE(dm.day1, 0) + COALESCE(dm.day2, 0) + COALESCE(dm.day3, 0) + COALESCE(dm.day4, 0) + COALESCE(dm.day5, 0) + COALESCE(dm.day6, 0) + COALESCE(dm.day7, 0))
            ELSE (COALESCE(dm.day1, 0) + COALESCE(dm.day2, 0) + COALESCE(dm.day3, 0) + COALESCE(dm.day4, 0) + COALESCE(dm.day5, 0) + COALESCE(dm.day6, 0) + COALESCE(dm.day7, 0) + COALESCE(rb.reportBookMarks, 0))
          END AS totalMarks,
          (dm.day1 IS NOT NULL OR dm.day2 IS NOT NULL OR dm.day3 IS NOT NULL OR dm.day4 IS NOT NULL OR dm.day5 IS NOT NULL OR dm.day6 IS NOT NULL OR dm.day7 IS NOT NULL OR rb.reportBookMarks IS NOT NULL) AS participated
        FROM registrations r
        LEFT JOIN dailyMarks dm ON r.username = dm.username
        LEFT JOIN reportBooks rb ON r.username = rb.username
      ) m
    \`;
`;

content = content.replace(
  "// Get new statistics with slot filter",
  MARKS_SUBQUERY_JS + "\n    // Get new statistics with slot filter"
);

content = content.replace(
  /FROM marks m\s+JOIN registrations r ON m.username = r.username\s+WHERE m.totalMarks >= 60 \$\{slotFilterAnd\}/g,
  "FROM ${MARKS_SUBQUERY} WHERE m.totalMarks >= 60 AND m.participated = 1 ${slotFilterAnd.replace('r.slot', 'm.slot')}"
);

content = content.replace(
  /FROM marks m\s+JOIN registrations r ON m.username = r.username\s+WHERE m.totalMarks < 60 \$\{slotFilterAnd\}/g,
  "FROM ${MARKS_SUBQUERY} WHERE m.totalMarks < 60 AND m.participated = 1 ${slotFilterAnd.replace('r.slot', 'm.slot')}"
);

content = content.replace(
  /FROM marks m\s+JOIN registrations r ON m.username = r.username\s+WHERE m.totalMarks IS NOT NULL \$\{slotFilterAnd\}/g,
  "FROM ${MARKS_SUBQUERY} WHERE m.participated = 1 ${slotFilterAnd.replace('r.slot', 'm.slot')}"
);

content = content.replace(
  /FROM marks m\s+JOIN registrations r ON m.username = r.username\s+\$\{slotFilter\}/g,
  "FROM ${MARKS_SUBQUERY} WHERE m.participated = 1 ${slotFilter.replace('WHERE ', 'AND ').replace('r.slot', 'm.slot')}"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed overview stats queries');
