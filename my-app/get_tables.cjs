const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });
async function getTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME
  });
  const [tables] = await connection.query('SHOW TABLES');
  console.log(tables);
  await connection.end();
}
getTables();
