import mysql from "mysql2/promise";

export default async function getDBConnection() {
  return await mysql.createConnection({
    host: 'localhost',
    user: 'karthik',
    password: 'asdfghjk',
    database: 'Intern',
  });
}
