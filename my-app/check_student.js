import db from './src/lib/db.js';
async function test() {
  const [rows] = await db.query('SELECT * FROM registrations WHERE username = "2500030057"');
  console.log('2500030057:', rows[0]);
  process.exit(0);
}
test();
