import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function createAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    // You can change these details before running the script
    const adminUsername = '2400030188';
    const adminName = 'Admin User';
    const plainPassword = 'NISchal@2006'; 
    
    const hashedPassword = await bcrypt.hash(plainPassword, 10);
    
    const [rows] = await connection.query('SELECT * FROM users WHERE username = ?', [adminUsername]);
    
    if (rows.length > 0) {
      console.log(`User ${adminUsername} already exists. Updating role to 'admin' and resetting password to '${plainPassword}'...`);
      await connection.query('UPDATE users SET role = "admin", password = ? WHERE username = ?', [hashedPassword, adminUsername]);
      console.log('Admin user updated successfully.');
    } else {
      console.log(`Creating new admin user: ${adminUsername}...`);
      await connection.query(
        'INSERT INTO users (username, name, password, role) VALUES (?, ?, ?, "admin")',
        [adminUsername, adminName, hashedPassword]
      );
      console.log(`Admin user created successfully! Username: ${adminUsername}, Password: ${plainPassword}`);
    }
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  } finally {
    await connection.end();
  }
}

createAdmin();
