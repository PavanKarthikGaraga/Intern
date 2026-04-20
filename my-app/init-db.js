import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Connecting with USER:', process.env.DB_USER);
console.log('Connecting to HOST:', process.env.DB_HOST);

async function initDB() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true
  });

  try {
    const sqlFileContent = fs.readFileSync(path.join(process.cwd(), 'src/lib/tables.sql'), 'utf-8');
    
    console.log('Executing tables.sql to create database and tables...');
    await connection.query(sqlFileContent);
    console.log('Database and tables initialized successfully.');
    
    await connection.query('USE `Social_2026`;');
    
    // Check if stats row already exists to prevent duplicate rows on re-runs
    const [rows] = await connection.query('SELECT * FROM stats LIMIT 1');
    if (rows.length === 0) {
        console.log('Inserting initial stats row...');
        await connection.query('INSERT INTO stats() VALUES ();');
    }
    
    console.log('Initialization completed!');
  } catch (error) {
    console.error('Error during database initialization:', error);
  } finally {
    await connection.end();
  }
}

initDB();
