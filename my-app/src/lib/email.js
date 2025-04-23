import { DOMAINS } from '../app/Data/domains';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { emailQueue } from './emailQueue';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Map of domain names to exact filenames
// const domainFileMap = {
//   "Agriculture": "Agriculture.pdf",
//   "Green Innovations & Tree Plantation": "Green Innovations & Tree Plantation.pdf",
//   "Rural/Urban Education": "Rural & Urban Education.pdf",
//   "Water Conservation": "Water Conservation.pdf",
//   "Community Actions": "Community Actions.pdf",
//   "Health and Hygiene": "Health and Hygiene.pdf",
//   "Cultural Heritage and Community Narratives": "Cultural Heritage & Narratives.pdf",
//   "Livelihood and Entrepreneurship": "Livelihood & Entrepreneurship.pdf",
//   "Skill Identification and Development": "Skill Identification & Development.pdf",
//   "Women Empowerment & Gender Equality": "Women Empowerment & Gender Equality.pdf",
//   "Digital Literacy & ICT for Rural Development": "Digital Literacy & ICT.pdf",
//   "Mental Health & Well-Being": "Mental Health & Well-Being.pdf",
//   "Sports and Wellness Engagement": "Sports & Wellness Engagement.pdf",
//   "Disaster Preparedness & Community Resilience": "Disaster Preparedness & Resilience.pdf",
//   "Nutrition & Food Security": "Nutrition & Food Security.pdf",
//   "Village Infrastructure": "Village Infrastructure.pdf",
//   "Energy Utilization and Efficiency": "Energy Utilization & Efficiency.pdf",
//   "Renewable Energy & Sustainability": "Renewable Energy & Sustainability.pdf",
//   "Waste Management": "Waste Management.pdf",
//   "Water and Sanitation": "Water and Sanitation.pdf"
// };

// Helper function to read template file
const readTemplate = (templateName) => {
  const templatePath = path.join(__dirname, '..', 'email-templates', `${templateName}.html`);
  return fs.readFileSync(templatePath, 'utf8');
};

// Helper function to replace template variables
const replaceTemplateVariables = (template, data) => {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), value);
  }
  return result;
};

// Email templates
const emailTemplates = {
  registration: (userData) => {
    const template = readTemplate('registration');
    const html = replaceTemplateVariables(template, {
      name: userData.name,
      selectedDomain: userData.selectedDomain,
      idNumber: userData.idNumber,
      phoneNumber: userData.phoneNumber.slice(-4),
      branch: userData.branch,
      year: userData.year,
    });

    return {
      subject: 'Welcome to Social Internship - Registration Confirmation',
      html
    };
  },
  
  forgotPassword: (resetLink) => {
    const template = readTemplate('forgot-password');
    const html = replaceTemplateVariables(template, { resetLink });
    
    return {
      subject: 'Password Reset Request - Social Internship',
      html
    };
  },
  
  attendanceMarked: (studentData) => {
    const template = readTemplate('attendance-marked');
    const html = replaceTemplateVariables(template, {
      name: studentData.name || 'Student',
      day: studentData.day || 'N/A',
      status: studentData.status || 'Not Specified',
      idNumber: studentData.idNumber || 'N/A',
      date: new Date().toLocaleDateString(),
      documentUrl: studentData.documentUrl || ''
    });
    
    return {
      subject: `Attendance Marked - Day ${studentData.day || 'N/A'} - Social Internship`,
      html
    };
  }
};

// Send email function
export const sendEmail = async (to, template, data) => {
  try {
    const { subject, html, attachments } = emailTemplates[template](data);
    
    // Add job to the email queue
    await emailQueue.add({
      email: to,
      subject,
      html,
      attachments,
      attempts: 0 // Initialize attempts counter
    });

    return { success: true };
  } catch (error) {
    console.error('Failed to queue email:', error);
    return { success: false, error: error.message };
  }
}; 