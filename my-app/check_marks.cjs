require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL || {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  const [rows] = await connection.execute('SELECT * FROM marks WHERE username = "2400040004"');
  console.log("Marks table for 2400040004:", rows);

  const [rows2] = await connection.execute('SELECT * FROM dailyMarks WHERE username = "2400040004"');
  console.log("dailyMarks table for 2400040004:", rows2);

  const [rows3] = await connection.execute('SELECT * FROM registrations WHERE username = "2400040004"');
  console.log("registrations table for 2400040004:", rows3);

  await connection.end();
}
check().catch(console.error);
