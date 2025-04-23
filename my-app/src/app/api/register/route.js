import pool from "../../../lib/db.js";
import bcrypt from 'bcryptjs';
import { sendEmail } from '../../../lib/email.js';

export async function POST(request) {
  let db;
  try {
    db = await pool.getConnection(); // Get a new connection
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

      // Check slot availability
      const [stats] = await db.query('SELECT * FROM stats ORDER BY id DESC LIMIT 1');
      if (!stats || stats.length === 0) {
        throw new Error('Stats not found');
      }

      const currentStats = stats[0];
      const slotField = `slot${formData.slot}`;
      const modeField = formData.mode.toLowerCase();
      const slotModeField = `slot${formData.slot}${formData.mode}`;

      // Check if slot is full (max 1200)
      if (currentStats[slotField] >= 1200) {
        throw new Error(`Slot ${formData.slot} is full (maximum 1200 students)`);
      }

      // Check if mode in slot is full
      if (formData.mode === 'Remote') {
        // Remote mode max is 1000
        if (currentStats[slotModeField] >= 1000) {
          throw new Error(`Remote mode in Slot ${formData.slot} is full (maximum 1000 students)`);
        }
      } else if (formData.mode === 'Incampus') {
        // In-Campus mode max is 150
        if (currentStats[slotModeField] >= 150) {
          throw new Error(`In-Campus mode in Slot ${formData.slot} is full (maximum 150 students)`);
        }
      } else if (formData.mode === 'InVillage') {
        // In-Village mode max is 50
        if (currentStats[slotModeField] >= 50) {
          throw new Error(`In-Village mode in Slot ${formData.slot} is full (maximum 50 students)`);
        }
      }

      // Generate username from ID number
      const username = formData.studentInfo.idNumber;

      // 1. Insert into registrations
      const registrationQuery = `
        INSERT INTO registrations 
        (selectedDomain, mode, slot, username, name, email, branch, gender, year, phoneNumber, 
        residenceType, hostelName, busRoute, country, state, district, pincode)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      // 2. Insert into users
      const usersQuery = `INSERT INTO users
        (name, username, password, role)
        VALUES(?, ?, ?, ?)`;

      // 3. Insert into verify (initialize with all days as false)
      const verifyQuery = `INSERT INTO verify
        (username, day1, day2, day3, day4, day5, day6, day7)
        VALUES(?, false, false, false, false, false, false, false)`;

      // 4. Insert into attendance (initialize with null values)
      const attendanceQuery = `INSERT INTO attendance
        (username, day1, day2, day3, day4, day5, day6, day7)
        VALUES(?, null, null, null, null, null, null, null)`;

      // 5. Insert into uploads (initialize with null values)
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

      // Execute all queries
      await db.query(registrationQuery, registrationValues);
      await db.query(usersQuery, userValues);
      await db.query(verifyQuery, [username]);
      await db.query(attendanceQuery, [username]);
      await db.query(uploadsQuery, [username]);

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
          //   totalActive = totalActive + 1

      const emailData = {
        name: formData.studentInfo.name,
        idNumber: formData.studentInfo.idNumber,
        selectedDomain: formData.selectedDomain,
        branch: formData.studentInfo.branch,
        year: formData.studentInfo.year,
        phoneNumber: formData.studentInfo.phoneNumber
      };

      await sendEmail(formData.studentInfo.email, 'registration', emailData);
    
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
