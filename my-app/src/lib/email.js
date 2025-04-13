import nodemailer from 'nodemailer';

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD
  }
});

// Email templates
const emailTemplates = {
  registration: (userData) => ({
    subject: 'Welcome to Smart Village Revolution - Registration Confirmation',
    html: `
      <h2>Welcome to Smart Village Revolution!</h2>
      <p>Dear ${userData.name},</p>
      <p>Your registration has been successfully completed. Here are your details:</p>
      <ul>
        <li>ID Number: ${userData.idNumber}</li>
        <li>Selected Domain: ${userData.selectedDomain}</li>
        <li>Branch: ${userData.branch}</li>
        <li>Year: ${userData.year}</li>
      </ul>
      <p>You can now log in to your account using your ID number and the password you created.</p>
      <p>Best regards,<br>Smart Village Revolution Team</p>
    `
  }),
  
  forgotPassword: (resetLink) => ({
    subject: 'Password Reset Request - Smart Village Revolution',
    html: `
      <h2>Password Reset Request</h2>
      <p>You have requested to reset your password. Click the link below to proceed:</p>
      <p><a href="${resetLink}">Reset Password</a></p>
      <p>If you did not request this, please ignore this email.</p>
      <p>This link will expire in 15 minutes.</p>
      <p>Best regards,<br>Smart Village Revolution Team</p>
    `
  }),
  
  attendanceMarked: (studentData, day, status) => ({
    subject: `Attendance Marked - Day ${day} - Smart Village Revolution`,
    html: `
      <h2>Attendance Update</h2>
      <p>Dear ${studentData.name},</p>
      <p>Your attendance for Day ${day} has been marked as <strong>${status}</strong>.</p>
      <p>Details:</p>
      <ul>
        <li>ID Number: ${studentData.idNumber}</li>
        <li>Date: ${new Date().toLocaleDateString()}</li>
        <li>Status: ${status}</li>
      </ul>
      <p>If you believe this is incorrect, please contact your mentor.</p>
      <p>Best regards,<br>Smart Village Revolution Team</p>
    `
  })
};

// Send email function
export const sendEmail = async (to, template, data) => {
  try {
    const { subject, html } = emailTemplates[template](data);
    
    const mailOptions = {
      from: process.env.USER_EMAIL,
      to,
      subject,
      html
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
}; 