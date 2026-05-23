const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    const [rows] = await connection.query('SELECT * FROM reportBooks');
    console.log("reportBooks:", rows);
  } catch (err) {
    console.error("Error reading reportBooks:", err.message);
  } finally {
    await connection.end();
  }
}

check();
