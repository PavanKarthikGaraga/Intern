
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function applyMigration() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    console.log('Connected to database:', process.env.DB_NAME);

    const migrationSql = `
      -- 1. Add 'season' and other columns to registrations table
      ALTER TABLE registrations
        ADD COLUMN IF NOT EXISTS season VARCHAR(10) NOT NULL DEFAULT '2026',
        ADD COLUMN IF NOT EXISTS batch VARCHAR(10) DEFAULT NULL,
        ADD COLUMN IF NOT EXISTS fieldOfInterest VARCHAR(100) DEFAULT NULL;

      -- 2. Add slot7-slot9 columns to stats table
      ALTER TABLE stats
        ADD COLUMN IF NOT EXISTS slot7 INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS slot8 INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS slot9 INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS slot7Remote INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS slot7Incamp INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS slot7Invillage INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS slot8Remote INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS slot8Incamp INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS slot8Invillage INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS slot9Remote INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS slot9Incamp INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS slot9Invillage INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS season VARCHAR(10) NOT NULL DEFAULT '2026';

      -- 3. Add slot7-slot9 columns to reportOpen table
      ALTER TABLE reportOpen
        ADD COLUMN IF NOT EXISTS slot7 BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS slot8 BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS slot9 BOOLEAN DEFAULT FALSE;

      -- 4. Tag existing rows explicitly
      UPDATE registrations SET season = '2025' WHERE season IS NULL OR season = '';
      UPDATE stats SET season = '2025' WHERE season IS NULL OR season = '';

      -- 5. Ensure a 2026 stats row exists
      INSERT INTO stats (season) 
      SELECT '2026' FROM DUAL 
      WHERE NOT EXISTS (SELECT 1 FROM stats WHERE season = '2026');
    `;

    console.log('Running migration...');
    await connection.query(migrationSql);
    console.log('Migration completed successfully! 🎉');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (connection) await connection.end();
  }
}

applyMigration();
