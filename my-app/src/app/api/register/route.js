import pool from "../../../lib/db.js";
import bcrypt from 'bcryptjs';
import { sendEmail } from '../../../lib/email.js';

const yearMap = {
  '1': '1st',
  '2': '2nd',
  '3': '3rd',
  '4': '4th'
};

const residenceTypeMap = {
  'dayscholar': 'Day Scholar',
  'hostel': 'Hostel'
};

// Helper function to retry database operations with exponential backoff
async function retryOperation(operation, maxRetries = 3, initialDelay = 1000) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (error.code === 'ER_LOCK_WAIT_TIMEOUT' && i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i); // Exponential backoff
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

    // Set transaction isolation level before starting the transaction
    await db.query('SET SESSION TRANSACTION ISOLATION LEVEL READ COMMITTED');
    await db.beginTransaction();
    
    try {
      // Use a single query to check both username and phone number
      if (formData.mode === 'InVillage' && formData.studentInfo.gender === 'Female') {
        return new Response(JSON.stringify({ success: false, message: 'In-Village mode is not available for female students' }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      
      const [existingUser] = await db.query(
        'SELECT username, phoneNumber FROM registrations WHERE username = ? OR phoneNumber = ?',
        [formData.studentInfo.idNumber, formData.studentInfo.phoneNumber]
      );

      if (existingUser && existingUser.length > 0) {
        const error = existingUser[0].username === formData.studentInfo.idNumber
          ? 'Username already registered'
          : 'Phone number already registered';
        return new Response(JSON.stringify({ success: false, message: error }), {
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

      // Prepare all queries in a single batch
      const queries = [
        {
          query: `INSERT INTO registrations 
            (selectedDomain, mode, slot, username, name, email, branch, gender, year, phoneNumber, 
            residenceType, hostelName, busRoute, country, state, district, pincode)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          values: [
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
          ]
        },
        {
          query: `INSERT INTO users (name, username, password, role) VALUES(?, ?, ?, ?)`,
          values: [
            formData.studentInfo.name,
            username,
            await bcrypt.hash(`${username}${formData.studentInfo.phoneNumber.slice(-4)}`, 10),
            "student"
          ]
        },
        {
          query: `INSERT INTO verify (username, day1, day2, day3, day4, day5, day6, day7)
            VALUES(?, false, false, false, false, false, false, false)`,
          values: [username]
        },
        {
          query: `INSERT INTO attendance (username, day1, day2, day3, day4, day5, day6, day7)
            VALUES(?, null, null, null, null, null, null, null)`,
          values: [username]
        },
        {
          query: `INSERT INTO uploads (username, day1, day2, day3, day4, day5, day6, day7)
            VALUES(?, null, null, null, null, null, null, null)`,
          values: [username]
        }
      ];

      // Execute all queries in parallel
      await Promise.all(queries.map(q => db.query(q.query, q.values)));

      // Update stats
      await db.query(`
        UPDATE stats 
        SET 
          ${slotField} = ${slotField} + 1,
          ${modeField} = ${modeField} + 1,
          ${slotModeField} = ${slotModeField} + 1,
          totalStudents = totalStudents + 1
        WHERE id = ?
      `, [currentStats.id]);

      // Commit transaction
      await db.commit();

      // Send email asynchronously without waiting
      const emailData = {
        name: formData.studentInfo.name,
        idNumber: formData.studentInfo.idNumber,
        selectedDomain: formData.selectedDomain,
        branch: formData.studentInfo.branch,
        year: formData.studentInfo.year,
        phoneNumber: formData.studentInfo.phoneNumber
      };

      sendEmail(formData.studentInfo.email, 'registration', emailData)
        .catch(error => console.error('Email sending failed:', error));

      return new Response(JSON.stringify({ success: true }), {
        status: 201,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      await db.rollback();
      console.error('Error during registration:', error); // Log the error for debugging
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
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
