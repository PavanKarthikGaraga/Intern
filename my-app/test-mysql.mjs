import pool from './src/lib/db.js';

async function main() {
  const [rows] = await pool.query('SELECT * FROM marks WHERE username = "2500032234"');
  console.log('Marks:', rows);
  
  const [reg] = await pool.query('SELECT * FROM registrations WHERE username = "2500032234"');
  console.log('Registration:', reg);
  process.exit(0);
}
main().catch(console.error);
