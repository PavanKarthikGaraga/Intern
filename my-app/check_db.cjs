const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Svr@321',
    database: 'Social'
  });

  const [rows] = await connection.query(`
    SELECT m.username, m.totalMarks, m.internalMarks, m.finalReport, m.finalPresentation, m.completed, r.slot
    FROM marks m
    LEFT JOIN registrations r ON m.username = r.username
    WHERE m.username IN ('2400040004', '2400040007', '2400040017', '2400040029')
  `);
  
  console.log("Students from Social DB (marks table):", rows);

  const [rows2] = await connection.query(`
    SELECT * FROM certificates 
    WHERE username IN ('2400040004', '2400040007', '2400040017', '2400040029')
  `);
  console.log("Certificates found:", rows2.length);

  await connection.end();
}

main().catch(console.error);
