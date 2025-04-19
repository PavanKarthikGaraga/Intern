import nodemailer from 'nodemailer';
import { DOMAINS } from '../app/Data/domains';
import path from 'path';

// Create a transporter using Outlook/Office 365
const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.USER_EMAIL,
    pass: process.env.USER_PASSWORD
  },
  tls: {
    ciphers: 'SSLv3'
  }
});

// Map of domain names to exact filenames
const domainFileMap = {
  "Agriculture": "Agriculture.pdf",
  "Green Innovations & Tree Plantation": "Green Innovations & Tree Plantation.pdf",
  "Rural/Urban Education": "Rural & Urban Education.pdf",
  "Water Conservation": "Water Conservation.pdf",
  "Community Actions": "Community Actions.pdf",
  "Health and Hygiene": "Health and Hygiene.pdf",
  "Cultural Heritage and Community Narratives": "Cultural Heritage & Narratives.pdf",
  "Livelihood and Entrepreneurship": "Livelihood & Entrepreneurship.pdf",
  "Skill Identification and Development": "Skill Identification & Development.pdf",
  "Women Empowerment & Gender Equality": "Women Empowerment & Gender Equality.pdf",
  "Digital Literacy & ICT for Rural Development": "Digital Literacy & ICT.pdf",
  "Mental Health & Well-Being": "Mental Health & Well-Being.pdf",
  "Sports and Wellness Engagement": "Sports & Wellness Engagement.pdf",
  "Disaster Preparedness & Community Resilience": "Disaster Preparedness & Resilience.pdf",
  "Nutrition & Food Security": "Nutrition & Food Security.pdf",
  "Village Infrastructure": "Village Infrastructure.pdf",
  "Energy Utilization and Efficiency": "Energy Utilization & Efficiency.pdf",
  "Renewable Energy & Sustainability": "Renewable Energy & Sustainability.pdf",
  "Waste Management": "Waste Management.pdf",
  "Water and Sanitation": "Water and Sanitation.pdf"
};

// Email templates
const emailTemplates = {
  registration: (userData) => {
    // Get the correct file name from the map
    const selectedDomain = userData.selectedDomain;
    const fileName = domainFileMap[selectedDomain];
    const pdfPath = fileName ? `/Domains/${fileName}` : null;
    const absolutePath = fileName
      ? path.join(process.cwd(), 'public', 'Domains', fileName)
      : null;

    return {
      from: 'sac@kluniversity.in',
      subject: 'Welcome to Smart Village Revolution - Registration Confirmation',
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
          <title>Welcome to Smart Village Revolution</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
              font-size: 16px;
              line-height: 1.7;
              color: #2d3748;
              background-color: #f7f9fc;
              margin: 0;
              padding: 30px 20px;
            }

            .container {
              max-width: 700px;
              margin: 0 auto;
              background: #ffffff;
              padding: 40px 50px;
              border-radius: 12px;
              box-shadow: rgba(17, 12, 46, 0.15) 0px 48px 100px 0px;
              border: none;
            }

            .logo {
              display: block;
              margin: 0 auto 40px;
              max-width: 120px;
              height: auto;
              filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08));
            }

            h1 {
              color: #1a202c;
              font-size: clamp(1.5rem, 5vw, 1.75rem);
              margin-bottom: 40px;
              text-align: center;
              text-transform: uppercase;
              letter-spacing: 1.2px;
              font-weight: 700;
              position: relative;
              padding-bottom: 20px;
            }

            h1::after {
              content: '';
              position: absolute;
              bottom: 0;
              left: 50%;
              transform: translateX(-50%);
              width: 60px;
              height: 2px;
              background: linear-gradient(to right, rgb(151, 0, 3), rgba(151, 0, 3, 0.7));
              border-radius: 2px;
            }

            p {
              margin-bottom: 20px;
              color: #222222;
              font-size: clamp(0.9rem, 2.5vw, 1rem);
              line-height: 1.8;
            }

            p strong {
              color: rgb(151, 0, 3);
              font-weight: 600;
            }

            .highlight {
              color: rgb(151, 0, 3);
              font-weight: 600;
              background: rgba(151, 0, 3, 0.05);
              padding: 3px 10px;
              border-radius: 3px;
              display: inline-block;
              border: 1px solid rgba(151, 0, 3, 0.1);
            }

            ol, ul {
              margin: 0 0 24px 24px;
              color: #222222;
              padding-left: 16px;
            }

            li {
              margin-bottom: 12px;
              padding-left: 8px;
              line-height: 1.7;
            }

            li strong {
              color: rgb(151, 0, 3);
            }

            .warm-regards {
              margin-top: 50px;
              padding-top: 35px;
              border-top: 1px solid #e2e8f0;
              color: #4a5568;
            }

            .warm-regards p {
              margin-bottom: 8px;
              line-height: 1.6;
            }

            a {
              color: rgb(151, 0, 3);
              text-decoration: none;
              border-bottom: 1px solid rgba(151, 0, 3, 0.2);
              transition: all 0.2s ease;
            }

            a:hover {
              color: rgba(151, 0, 3, 0.8);
              border-bottom-color: rgba(151, 0, 3, 0.8);
            }

            @media (max-width: 768px) {
              body {
                padding: 15px;
              }

              .container {
                max-width: 90%;
                padding: 20px;
                margin: 0 auto;
              }

              h1 {
                font-size: clamp(1.2rem, 5vw, 1.5rem);
                margin-bottom: 25px;
              }

              .logo {
                max-width: 100px;
              }

              p {
                font-size: clamp(0.9rem, 3vw, 1rem);
              }

              ol, ul {
                padding-left: 20px;
              }

              li {
                font-size: clamp(0.9rem, 3vw, 1rem);
              }

              .warm-regards p {
                font-size: clamp(0.85rem, 2.5vw, 1rem);
              }
            }

            @media (prefers-color-scheme: dark) {
              body {
                background-color: #f7f9fc;
              }

              .container {
                background: #ffffff;
                box-shadow: rgba(17, 12, 46, 0.15) 0px 48px 100px 0px;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <img src="/sac.png" alt="SAC Logo" class="logo">
            <h1>Welcome to <br> Smart Village Revolution!</h1>
            <p>Dear <strong>${userData.name}</strong>,</p>
            <p><strong>Congratulations on successfully registering with the Smart Village Revolution program!</strong></p>
            <p>We are delighted to have you as part of this dynamic and vibrant ecosystem of <span class="highlight">${userData.selectedDomain}</span> domain where your passions and aspirations take center stage.</p>
            
            <div class="login-credentials">
              <h3>Your Login Credentials</h3>
              <p><strong>Username:</strong> ${userData.idNumber}</p>
              <p><strong>Password:</strong> ${userData.idNumber}${userData.phoneNumber.slice(-4)}</p>
              <p class="note">Please keep these credentials safe and do not share them with anyone.</p>
            </div>

            <p><strong>Your Registration Details:</strong></p>
            <ul>
              <li><strong>ID Number:</strong> ${userData.idNumber}</li>
              <li><strong>Selected Domain:</strong> ${userData.selectedDomain}</li>
              <li><strong>Branch:</strong> ${userData.branch}</li>
              <li><strong>Year:</strong> ${userData.year}</li>
            </ul>

            ${pdfPath ? `
            <div class="domain-document">
              <h3>Domain Document</h3>
              <p>Please find attached the document related to your selected domain. This document contains important information about your domain's objectives, activities, and expectations.</p>
              <p>Make sure to go through this document carefully to understand your domain's requirements and guidelines.</p>
            </div>
            ` : ''}

            <p><strong>What to Expect Next?</strong></p>
            <ol>
              <li><strong>Active Participation:</strong> You will soon receive updates about your domain's activities, events, and initiatives. Make sure to actively engage in all programs to make the most of this journey.</li>
              <li><strong>Rules and Guidelines:</strong> Please ensure you adhere to the rules and regulations outlined during the registration process, which aim to create a productive and respectful environment for all.</li>
              <li><strong>Collaboration and Growth:</strong> Work collaboratively with peers and mentors to achieve not just your goals but also contribute to the collective success of your domain.</li>
            </ol>

            <p><strong>Your Role in the SVR Journey</strong></p>
            <p>The Smart Village Revolution is more than just a program; it is a platform to:</p>
            <ul>
              <li>Transform your ideas into impactful projects.</li>
              <li>Build leadership, teamwork, and innovative skills.</li>
              <li>Network with peers, mentors, and industry experts.</li>
              <li>Contribute meaningfully to the university's vision of excellence and societal development.</li>
            </ul>

            <p>We encourage you to make the most of this opportunity by participating actively, respecting the program's values, and striving for personal and professional growth.</p>
            <p>If you have any questions or need assistance, feel free to contact the Smart Village Revolution Office or your domain coordinator. We are here to support and guide you throughout this exciting journey.</p>
            <p>Once again, welcome to the Smart Village Revolution - where your dreams take flight!</p>

            <div class="warm-regards">
              <p>Warm regards,<br>
              <strong>Smart Village Revolution Team</strong><br>
              KL University<br>
              Email: <a href="mailto:svr@kluniversity.in">svr@kluniversity.in</a><br>
              Website: <a href="https://svr.kluniversity.in" target="_blank">https://svr.kluniversity.in</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: absolutePath ? [{
        filename: fileName,
        path: absolutePath
      }] : []
    };
  },
  
  forgotPassword: (resetLink) => ({
    subject: 'Password Reset Request - Smart Village Revolution',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Password Reset Request</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            font-size: 16px;
            line-height: 1.7;
            color: #2d3748;
            background-color: #f7f9fc;
            margin: 0;
            padding: 30px 20px;
          }

          .container {
            max-width: 700px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px 50px;
            border-radius: 12px;
            box-shadow: rgba(17, 12, 46, 0.15) 0px 48px 100px 0px;
            border: none;
          }

          .logo {
            display: block;
            margin: 0 auto 40px;
            max-width: 120px;
            height: auto;
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08));
          }

          h1 {
            color: #1a202c;
            font-size: clamp(1.5rem, 5vw, 1.75rem);
            margin-bottom: 40px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            font-weight: 700;
            position: relative;
            padding-bottom: 20px;
          }

          h1::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 2px;
            background: linear-gradient(to right, rgb(151, 0, 3), rgba(151, 0, 3, 0.7));
            border-radius: 2px;
          }

          p {
            margin-bottom: 20px;
            color: #222222;
            font-size: clamp(0.9rem, 2.5vw, 1rem);
            line-height: 1.8;
          }

          p strong {
            color: rgb(151, 0, 3);
            font-weight: 600;
          }

          .button {
            display: inline-block;
            background-color: rgb(151, 0, 3);
            color: white;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
            transition: background-color 0.2s ease;
          }

          .button:hover {
            background-color: rgb(120, 0, 2);
          }

          .warm-regards {
            margin-top: 50px;
            padding-top: 35px;
            border-top: 1px solid #e2e8f0;
            color: #4a5568;
          }

          .warm-regards p {
            margin-bottom: 8px;
            line-height: 1.6;
          }

          a {
            color: rgb(151, 0, 3);
            text-decoration: none;
            border-bottom: 1px solid rgba(151, 0, 3, 0.2);
            transition: all 0.2s ease;
          }

          a:hover {
            color: rgba(151, 0, 3, 0.8);
            border-bottom-color: rgba(151, 0, 3, 0.8);
          }

          @media (max-width: 768px) {
            body {
              padding: 15px;
            }

            .container {
              max-width: 90%;
              padding: 20px;
              margin: 0 auto;
            }

            h1 {
              font-size: clamp(1.2rem, 5vw, 1.5rem);
              margin-bottom: 25px;
            }

            .logo {
              max-width: 100px;
            }

            p {
              font-size: clamp(0.9rem, 3vw, 1rem);
            }

            .warm-regards p {
              font-size: clamp(0.85rem, 2.5vw, 1rem);
            }
          }

          @media (prefers-color-scheme: dark) {
            body {
              background-color: #f7f9fc;
            }

            .container {
              background: #ffffff;
              box-shadow: rgba(17, 12, 46, 0.15) 0px 48px 100px 0px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="https://firebasestorage.googleapis.com/v0/b/sacwebsite-8d0b5.appspot.com/o/HeroVideo%2FOfficialSacLogo.png?alt=media&token=8a73bd93-832c-4d5d-819d-0e371d12b01c" alt="SVR Logo" class="logo">
          <h1>Password Reset Request</h1>
          <p>You have requested to reset your password for your Smart Village Revolution account.</p>
          <p>Click the button below to proceed with resetting your password:</p>
          <a href="${resetLink}" class="button">Reset Password</a>
          <p><strong>Important:</strong> This link will expire in 15 minutes for security reasons.</p>
          <p>If you did not request this password reset, please ignore this email or contact us if you have concerns.</p>
          <div class="warm-regards">
            <p>Warm regards,<br>
            <strong>Smart Village Revolution Team</strong><br>
            KL University<br>
            Email: <a href="mailto:svr@kluniversity.in">svr@kluniversity.in</a><br>
            Website: <a href="https://svr.kluniversity.in" target="_blank">https://svr.kluniversity.in</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  }),
  
  attendanceMarked: (studentData) => ({
    subject: `Attendance Marked - Day ${studentData.day || 'N/A'} - Smart Village Revolution`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>Attendance Update</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
            font-size: 16px;
            line-height: 1.7;
            color: #2d3748;
            background-color: #f7f9fc;
            margin: 0;
            padding: 30px 20px;
          }

          .container {
            max-width: 700px;
            margin: 0 auto;
            background: #ffffff;
            padding: 40px 50px;
            border-radius: 12px;
            box-shadow: rgba(17, 12, 46, 0.15) 0px 48px 100px 0px;
            border: none;
          }

          .logo {
            display: block;
            margin: 0 auto 40px;
            max-width: 120px;
            height: auto;
            filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.08));
          }

          h1 {
            color: #1a202c;
            font-size: clamp(1.5rem, 5vw, 1.75rem);
            margin-bottom: 40px;
            text-align: center;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            font-weight: 700;
            position: relative;
            padding-bottom: 20px;
          }

          h1::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 2px;
            background: linear-gradient(to right, rgb(151, 0, 3), rgba(151, 0, 3, 0.7));
            border-radius: 2px;
          }

          p {
            margin-bottom: 20px;
            color: #222222;
            font-size: clamp(0.9rem, 2.5vw, 1rem);
            line-height: 1.8;
          }

          p strong {
            color: rgb(151, 0, 3);
            font-weight: 600;
          }

          .status-badge {
            display: inline-block;
            padding: 5px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9rem;
            margin-left: 5px;
          }

          .status-present {
            background-color: rgba(72, 187, 120, 0.1);
            color: #2f855a;
            border: 1px solid rgba(72, 187, 120, 0.2);
          }

          .status-absent {
            background-color: rgba(245, 101, 101, 0.1);
            color: #c53030;
            border: 1px solid rgba(245, 101, 101, 0.2);
          }

          .details-box {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid rgb(151, 0, 3);
          }

          .details-box p {
            margin-bottom: 10px;
          }

          .details-box p:last-child {
            margin-bottom: 0;
          }

          .document-section {
            margin-top: 30px;
            padding: 20px;
            background-color: #f8fafc;
            border-radius: 8px;
            border: 1px solid #e2e8f0;
          }

          .document-section h3 {
            color: rgb(151, 0, 3);
            margin-top: 0;
            margin-bottom: 15px;
            font-size: 1.1rem;
            font-weight: 600;
          }

          .document-link {
            display: inline-block;
            background-color: rgb(151, 0, 3);
            color: white;
            text-decoration: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 10px;
            transition: background-color 0.2s ease;
          }

          .document-link:hover {
            background-color: rgb(120, 0, 2);
          }

          .warm-regards {
            margin-top: 50px;
            padding-top: 35px;
            border-top: 1px solid #e2e8f0;
            color: #4a5568;
          }

          .warm-regards p {
            margin-bottom: 8px;
            line-height: 1.6;
          }

          a {
            color: rgb(151, 0, 3);
            text-decoration: none;
            border-bottom: 1px solid rgba(151, 0, 3, 0.2);
            transition: all 0.2s ease;
          }

          a:hover {
            color: rgba(151, 0, 3, 0.8);
            border-bottom-color: rgba(151, 0, 3, 0.8);
          }

          @media (max-width: 768px) {
            body {
              padding: 15px;
            }

            .container {
              max-width: 90%;
              padding: 20px;
              margin: 0 auto;
            }

            h1 {
              font-size: clamp(1.2rem, 5vw, 1.5rem);
              margin-bottom: 25px;
            }

            .logo {
              max-width: 100px;
            }

            p {
              font-size: clamp(0.9rem, 3vw, 1rem);
            }

            .warm-regards p {
              font-size: clamp(0.85rem, 2.5vw, 1rem);
            }
          }

          @media (prefers-color-scheme: dark) {
            body {
              background-color: #f7f9fc;
            }

            .container {
              background: #ffffff;
              box-shadow: rgba(17, 12, 46, 0.15) 0px 48px 100px 0px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <img src="https://firebasestorage.googleapis.com/v0/b/sacwebsite-8d0b5.appspot.com/o/HeroVideo%2FOfficialSacLogo.png?alt=media&token=8a73bd93-832c-4d5d-819d-0e371d12b01c" alt="SVR Logo" class="logo">
          <h1>Attendance Update</h1>
          <p>Dear <strong>${studentData.name || 'Student'}</strong>,</p>
          <p>Your attendance for <strong>Day ${studentData.day || 'N/A'}</strong> has been marked as <span class="status-badge ${studentData.status === 'Present' ? 'status-present' : 'status-absent'}">${studentData.status || 'Not Specified'}</span>.</p>
          
          <div class="details-box">
            <p><strong>ID Number:</strong> ${studentData.idNumber || 'N/A'}</p>
            <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
            <p><strong>Status:</strong> ${studentData.status || 'Not Specified'}</p>
          </div>
          
          ${studentData.documentUrl ? `
          <div class="document-section">
            <h3>Submitted Document</h3>
            <p>You have submitted a document for this attendance record.</p>
            <a href="${studentData.documentUrl}" class="document-link" target="_blank">View Document</a>
          </div>
          ` : ''}
          
          <p>If you believe this is incorrect, please contact your mentor or the Smart Village Revolution office.</p>
          <p>Thank you for your participation in the Smart Village Revolution program!</p>

          <div class="warm-regards">
            <p>Warm regards,<br>
            <strong>Smart Village Revolution Team</strong><br>
            KL University<br>
            Email: <a href="mailto:svr@kluniversity.in">svr@kluniversity.in</a><br>
            Website: <a href="https://svr.kluniversity.in" target="_blank">https://svr.kluniversity.in</a></p>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Send email function
export const sendEmail = async (to, template, data) => {
  try {
    const { subject, html, attachments } = emailTemplates[template](data);
    
    const mailOptions = {
      from: process.env.USER_EMAIL,
      to,
      subject,
      html,
      attachments
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
}; 