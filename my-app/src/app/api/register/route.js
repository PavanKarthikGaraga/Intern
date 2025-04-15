import { pool } from "../../../config/db.js";
import bcrypt from 'bcryptjs';
import { sendEmail } from '../../../lib/email.js';

export async function POST(request) {
  try {
    const formData = await request.json();
    console.log(formData);

    // Insert student registration into the 'registrations' table
    const query1 = `
      INSERT INTO registrations 
      (username, selectedDomain, mode, name, email, branch, gender, year, phoneNumber, 
      residenceType, hostelName, busRoute, country, state, district, pincode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values1 = [
      formData.studentInfo.username,
      formData.selectedDomain,
      formData.mode,
      formData.studentInfo.name,
      formData.studentInfo.email,
      formData.studentInfo.branch,
      formData.studentInfo.gender,
      formData.studentInfo.year,
      formData.studentInfo.phoneNumber,
      formData.residence.type,
      formData.residence.hostelName,
      formData.residence.busRoute,
      formData.residence.country,
      formData.residence.state,
      formData.residence.district,
      formData.residence.pincode,
    ];

    const hashedPassword = await bcrypt.hash(`${formData.studentInfo.username}${formData.studentInfo.phoneNumber.slice(-4)}`, 10);

    const query2 = `
      INSERT INTO users
      (username, name, password, role)
      VALUES (?, ?, ?, ?)
    `;
    
    const values2 = [
      formData.studentInfo.username,  // username as username
      formData.studentInfo.name,
      hashedPassword,
      "student"  // role
    ];

    // Execute queries in sequence
    await pool.query(query1, values1);  // Insert into 'registrations'
    await pool.query(query2, values2);  // Insert into 'users'

    // Send welcome email
    const emailData = {
      name: formData.studentInfo.name,
      username: formData.studentInfo.username,
      selectedDomain: formData.selectedDomain,
      branch: formData.studentInfo.branch,
      year: formData.studentInfo.year
    };

    await sendEmail(formData.studentInfo.email, 'registration', emailData);

    return new Response(JSON.stringify({ success: true }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
