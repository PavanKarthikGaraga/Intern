import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config({ path: '.env' });

async function run() {
  const defaultPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 1,
    queueLimit: 0,
  });

  const search = "19";
  const search2 = "2500031832";
  const search3 = "2500031502";
  const search4 = "xyz";

  for (const s of [search, search2, search3, search4]) {
    const term = "%" + s + "%";
    const [rows] = await defaultPool.query(
      "SELECT r.username, r.name, r.email, r.selectedDomain, ps.problem_statement " +
      "FROM registrations r " +
      "LEFT JOIN problemStatements ps ON r.username = ps.username " +
      "WHERE (r.username LIKE ? OR r.name LIKE ? OR r.email LIKE ? OR r.selectedDomain LIKE ? OR ps.problem_statement LIKE ?)",
      [term, term, term, term, term]
    );

    console.log("Search:", s, "-> Results:", rows.length);
    if (rows.length > 0 && rows.length < 5) {
      console.log(rows.map(r => r.username + " | " + r.name).join("\\n"));
    }
  }

  process.exit(0);
}

run().catch(console.error);
