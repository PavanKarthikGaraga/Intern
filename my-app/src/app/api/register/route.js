import pool from "../../../lib/db.js";
import bcrypt from 'bcryptjs';
import { sendEmail } from '../../../lib/email.js';

// Helper function to retry database operations
async function retryOperation(operation, maxRetries = 3, delay = 1000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export async function POST(request) {
  let db;
  try {
    db = await pool.getConnection();
    const formData = await request.json();
    console.log(formData);

    // Start transaction
    await db.beginTransaction();

    try {
      // Check if username already exists
      const [existingUsername] = await db.query(
        'SELECT username FROM registrations WHERE username = ?',
        [formData.studentInfo.idNumber]
      );

      if (existingUsername && existingUsername.length > 0) {
        return new Response(JSON.stringify({ success: false, message: 'Username already registered' }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check if phone number already exists
      const [phoneNumber] = await db.query(
        'SELECT phoneNumber FROM registrations WHERE phoneNumber = ?',
        [formData.studentInfo.phoneNumber]
      );

      if (phoneNumber && phoneNumber.length > 0) {
        return new Response(JSON.stringify({ success: false, message: 'Phone number already registered' }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Check slot availability with retry
      const [stats] = await retryOperation(async () => {
        return await db.query('SELECT * FROM stats ORDER BY id DESC LIMIT 1 FOR UPDATE');
      });

      if (!stats || stats.length === 0) {
        throw new Error('Stats not found');
      }

      const currentStats = stats[0];
      const slotField = `slot${formData.slot}`;
      const modeField = formData.mode.toLowerCase();
      const slotModeField = formData.mode === 'Remote' ? `slot${formData.slot}Remote` : 
                          formData.mode === 'Incampus' ? `slot${formData.slot}Incamp` : 
                          `slot${formData.slot}Invillage`;

      // Check if slot is full (max 1200)
      if (currentStats[slotField] >= 1200) {
        throw new Error(`Slot ${formData.slot} is full (maximum 1200 students)`);
      }

      // Check if mode in slot is full
      if (formData.mode === 'Remote') {
        if (currentStats[slotModeField] >= 1000) {
          throw new Error(`Remote mode in Slot ${formData.slot} is full (maximum 1000 students)`);
        }
      } else if (formData.mode === 'Incampus') {
        if (currentStats[slotModeField] >= 150) {
          throw new Error(`In-Campus mode in Slot ${formData.slot} is full (maximum 150 students)`);
        }
      } else if (formData.mode === 'InVillage') {
        if (currentStats[slotModeField] >= 50) {
          throw new Error(`In-Village mode in Slot ${formData.slot} is full (maximum 50 students)`);
        }
      }

      // Generate username from ID number
      const username = formData.studentInfo.idNumber;

      // Prepare all queries
      const registrationQuery = `
        INSERT INTO registrations 
        (selectedDomain, mode, slot, username, name, email, branch, gender, year, phoneNumber, 
        residenceType, hostelName, busRoute, country, state, district, pincode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const usersQuery = `INSERT INTO users
        (name, username, password, role)
        VALUES(?, ?, ?, ?)`;

      const verifyQuery = `INSERT INTO verify
        (username, day1, day2, day3, day4, day5, day6, day7)
        VALUES(?, false, false, false, false, false, false, false)`;

      const attendanceQuery = `INSERT INTO attendance
        (username, day1, day2, day3, day4, day5, day6, day7)
        VALUES(?, null, null, null, null, null, null, null)`;

      const uploadsQuery = `INSERT INTO uploads
        (username, day1, day2, day3, day4, day5, day6, day7)
        VALUES(?, null, null, null, null, null, null, null)`;

      // Convert year to required format
      const yearMap = {
        '1': '1st',
        '2': '2nd',
        '3': '3rd',
        '4': '4th'
      };

      // Convert residence type to required format
      const residenceTypeMap = {
        'hostel': 'Hostel',
        'dayscholar': 'Day Scholar'
      };

      const registrationValues = [
        formData.selectedDomain,
        formData.mode,
        formData.slot,
        username,
        formData.studentInfo.name,
        formData.studentInfo.email,
        formData.studentInfo.branch,
        formData.studentInfo.gender,
        yearMap[formData.studentInfo.year],
        formData.studentInfo.phoneNumber,
        residenceTypeMap[formData.residence.type],
        formData.residence.hostelName || 'N/A',
        formData.residence.busRoute || null,
        formData.residence.country,
        formData.residence.state,
        formData.residence.district,
        formData.residence.pincode,
      ];

      const hashedPassword = await bcrypt.hash(
        `${username}${formData.studentInfo.phoneNumber.slice(-4)}`,
        10
      );

      const userValues = [
        formData.studentInfo.name,
        username,
        hashedPassword,
        "student"
      ];

      // Execute all queries with retry
      await retryOperation(async () => {
        await db.query(registrationQuery, registrationValues);
        await db.query(usersQuery, userValues);
        await db.query(verifyQuery, [username]);
        await db.query(attendanceQuery, [username]);
        await db.query(uploadsQuery, [username]);
      });

      // Update stats with retry
      await retryOperation(async () => {
        await db.query(`
          UPDATE stats 
          SET 
            ${slotField} = ${slotField} + 1,
            ${modeField} = ${modeField} + 1,
            ${slotModeField} = ${slotModeField} + 1,
            totalStudents = totalStudents + 1
          WHERE id = ?
        `, [currentStats.id]);
      });

      const emailData = {
        name: formData.studentInfo.name,
        idNumber: formData.studentInfo.idNumber,
        selectedDomain: formData.selectedDomain,
        branch: formData.studentInfo.branch,
        year: formData.studentInfo.year,
        phoneNumber: formData.studentInfo.phoneNumber
      };

      // await sendEmail(formData.studentInfo.email, 'registration', emailData);
    
      await db.commit();

      return new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      await db.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    if (db) {
      try {
        db.release(); 
      } catch (error) {
        console.error('Error releasing database connection:', error);
      }
    }
  }
}
