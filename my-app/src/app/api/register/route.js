import pool from "../../../lib/db.js";
import bcrypt from 'bcryptjs';
import { sendEmail } from '../../../lib/email.js';
import { logActivity } from '../../../lib/activityLog.js';

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
        'SELECT username, phoneNumber, season FROM registrations WHERE username = ? OR phoneNumber = ?',
        [formData.studentInfo.idNumber, formData.studentInfo.phoneNumber]
      );

      let isReRegistration = false;

      if (existingUser && existingUser.length > 0) {
        const slotNum = parseInt(formData.slot);
        const idMatch = existingUser.find(u => u.username === formData.studentInfo.idNumber);
        const phoneMatch = existingUser.find(u => u.phoneNumber === formData.studentInfo.phoneNumber);

        if (idMatch && idMatch.season === '2025' && slotNum >= 7 && slotNum <= 9) {
          if (phoneMatch && phoneMatch.username !== formData.studentInfo.idNumber) {
            return new Response(JSON.stringify({ success: false, message: 'Phone number already registered to another account' }), { status: 400 });
          }
          isReRegistration = true;
        } else {
          const error = idMatch
            ? 'Username already registered'
            : 'Phone number already registered';
          return new Response(JSON.stringify({ success: false, message: error }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
          });
        }
      }

      // Check slot availability with retry
      const [stats] = await retryOperation(async () => {
        return await db.query('SELECT * FROM stats ORDER BY id DESC LIMIT 1 FOR UPDATE');
      });

      if (!stats || stats.length === 0) {
        throw new Error('Stats not found');
      }

      const currentStats = stats[0];
      const slotNum = parseInt(formData.slot);

      // Validate slot range 1-9
      if (slotNum < 1 || slotNum > 9) {
        throw new Error('Invalid slot selected');
      }

      const slotField = `slot${formData.slot}`;
      const modeField = formData.mode.toLowerCase();
      const slotModeField = formData.mode === 'Remote' ? `slot${formData.slot}Remote` : 
                          formData.mode === 'Incampus' ? `slot${formData.slot}Incamp` : 
                          `slot${formData.slot}Invillage`;

      // Registration limits have been removed as per request
      
      // Generate username from ID number
      const username = formData.studentInfo.idNumber;

      // Prepare queries based on new registration vs re-registration
      let queries = [];

      if (isReRegistration) {
        queries = [
          { query: 'DELETE FROM marks WHERE username = ?', values: [username] },
          { query: 'DELETE FROM dailyMarks WHERE username = ?', values: [username] },
          { query: 'DELETE FROM verify WHERE username = ?', values: [username] },
          { query: 'DELETE FROM attendance WHERE username = ?', values: [username] },
          { query: 'DELETE FROM uploads WHERE username = ?', values: [username] },
          { query: 'DELETE FROM final WHERE username = ?', values: [username] },
          { query: 'DELETE FROM problemStatements WHERE username = ?', values: [username] },
          { query: 'DELETE FROM certificates WHERE username = ?', values: [username] },
          { query: 'DELETE FROM sstudents WHERE username = ?', values: [username] },
          { query: 'DELETE FROM sdailyMarks WHERE username = ?', values: [username] },
          { query: 'DELETE FROM sattendance WHERE username = ?', values: [username] },
          { query: 'DELETE FROM suploads WHERE username = ?', values: [username] },
          { query: 'DELETE FROM smessages WHERE username = ?', values: [username] },
          {
            query: `INSERT INTO users (name, username, password, role) VALUES(?, ?, ?, ?) ON DUPLICATE KEY UPDATE name = VALUES(name), password = VALUES(password)`,
            values: [
              formData.studentInfo.name,
              username,
              await bcrypt.hash(`${username}${formData.studentInfo.phoneNumber.slice(-4)}`, 10),
              "student"
            ]
          },
          {
            query: `UPDATE registrations SET 
              selectedDomain = ?, fieldOfInterest = ?, careerChoice = ?, batch = ?, mode = ?, slot = ?,
              name = ?, email = ?, branch = ?, gender = ?, year = ?, phoneNumber = ?, 
              residenceType = ?, hostelName = ?, busRoute = ?, country = ?, state = ?, district = ?, pincode = ?, 
              season = '2026', accommodation = ?, transportation = ?, pass = 0, studentLeadId = NULL, facultyMentorId = NULL
              WHERE username = ?`,
            values: [
              formData.selectedDomain,
              formData.fieldOfInterest || null,
              formData.careerChoice || null,
              formData.batch || null,
              formData.mode,
              formData.slot,
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
              formData.accommodationRequired || null,
              formData.transportationRequired || null,
              username
            ]
          },
          {
            query: `INSERT INTO verify (username, day1, day2, day3, day4, day5, day6, day7) VALUES(?, false, false, false, false, false, false, false)`,
            values: [username]
          },
          {
            query: `INSERT INTO attendance (username, day1, day2, day3, day4, day5, day6, day7) VALUES(?, null, null, null, null, null, null, null)`,
            values: [username]
          },
          {
            query: `INSERT INTO uploads (username, day1, day2, day3, day4, day5, day6, day7) VALUES(?, null, null, null, null, null, null, null)`,
            values: [username]
          }
        ];
      } else {
        queries = [
          {
            query: `INSERT INTO registrations 
              (selectedDomain, fieldOfInterest, careerChoice, batch, mode, slot, username, name, email, branch, gender, year, phoneNumber, 
              residenceType, hostelName, busRoute, country, state, district, pincode, season, accommodation, transportation)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            values: [
              formData.selectedDomain,
              formData.fieldOfInterest || null,
              formData.careerChoice || null,
              formData.batch || null,
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
              '2026',
              formData.accommodationRequired || null,
              formData.transportationRequired || null,
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
      }

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

      // Log registration
      logActivity({
        action: 'STUDENT_REGISTER',
        actorUsername: username,
        actorName: formData.studentInfo.name,
        actorRole: 'student',
        details: { domain: formData.selectedDomain, mode: formData.mode, slot: formData.slot }
      }).catch(() => {});

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
