const mysql = require('mysql2/promise');
require('dotenv').config(); // try .env first
if (!process.env.DB_HOST) {
    require('dotenv').config({ path: '.env.local' });
}

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
  });

  try {
    console.log("Creating reportDeadlines table...");
    await connection.query(`
      CREATE TABLE IF NOT EXISTS reportDeadlines (
          id BIGINT AUTO_INCREMENT PRIMARY KEY,
          slot INT NOT NULL UNIQUE,
          deadline DATETIME NOT NULL,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    
    console.log("Inserting default deadlines...");
    await connection.query(`
      INSERT INTO reportDeadlines (slot, deadline) VALUES
      (1, '2026-05-29 18:00:00'),
      (2, '2026-05-30 18:00:00'),
      (3, '2026-05-30 18:00:00'),
      (4, '2026-05-30 18:00:00'),
      (5, '2026-05-30 18:00:00'),
      (6, '2026-05-30 18:00:00')
      ON DUPLICATE KEY UPDATE deadline = VALUES(deadline);
    `);
    
    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err.message);
  } finally {
    await connection.end();
  }
}

runMigration();
