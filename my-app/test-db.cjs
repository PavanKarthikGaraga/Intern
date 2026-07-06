const mysql = require('mysql2/promise');
require('dotenv').config();
async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Svr@321',
    database: process.env.DB_NAME || 'Social_2026'
  });
  const [rows] = await connection.query('DESCRIBE registrations');
  console.log(rows.map(r => r.Field).join(', '));
  process.exit(0);
}
run();
