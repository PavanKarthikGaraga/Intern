const fs = require('fs');
const filePath = 'src/app/api/dashboard/admin/dev/full-rep/route.js';
let content = fs.readFileSync(filePath, 'utf8');

const newHtml = `
    <html xmlns:v="urn:schemas-microsoft-com:vml"
          xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns:m="http://schemas.microsoft.com/office/2004/12/omml"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset='utf-8'>
      <title>Social Internship Report</title>
      <style>
        @page Section1 {
          size: 8.5in 11.0in;
          margin: 1.0in 1.0in 1.0in 1.0in;
          mso-header-margin: 0.5in;
          mso-footer-margin: 0.5in;
          mso-footer: f1;
          mso-paper-source: 0;
        }
        div.Section1 { page: Section1; }
        
        body {
          font-family: 'Segoe UI', Calibri, Arial, sans-serif;
          line-height: 1.6;
          color: #2D3748;
        }
        
        h1, h2, h3, h4 {
          color: #1A365D;
          font-family: 'Georgia', serif;
        }
        
        .header-title {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #2B6CB0;
          padding-bottom: 20px;
        }
        
        .header-title h1 {
          font-size: 28pt;
          text-transform: uppercase;
          margin: 0;
          color: #2B6CB0;
        }
        
        .header-title h2 {
          font-size: 20pt;
          margin: 10px 0;
          color: #4A5568;
        }
        
        /* Infographic KPIs */
        .kpi-container {
          width: 100%;
          border-collapse: separate;
          border-spacing: 15px;
          margin: 20px 0;
        }
        .kpi-box {
          background-color: #EBF8FF;
          border: 2px solid #90CDF4;
          text-align: center;
          padding: 20px;
          width: 25%;
        }
        .kpi-value {
          font-size: 28pt;
          font-weight: bold;
          color: #2B6CB0;
          margin-bottom: 5px;
        }
        .kpi-label {
          font-size: 10pt;
          color: #4A5568;
          text-transform: uppercase;
          font-weight: bold;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 25px;
        }
        .data-table th {
          background-color: #2B6CB0;
          color: white;
          padding: 10px;
          border: 1px solid #2B6CB0;
          text-align: left;
        }
        .data-table td {
          padding: 10px;
          border: 1px solid #CBD5E0;
        }
        
        .section-header {
          border-left: 5px solid #2B6CB0;
          padding-left: 10px;
          margin-top: 30pt;
          background-color: #EDF2F7;
          padding: 10px;
        }
        
        .footer-text {
          text-align: center;
          color: #718096;
          font-size: 10pt;
        }
      </style>
    </head>
    <body>
      <div class="Section1">
      
        <div class="header-title">
          <h1>Student Activity Center (SAC)</h1>
          <h2>Social Internship</h2>
          <p style="font-size: 16pt; color: #718096; font-style: italic;">Monthly Progress Report – May 2026</p>
          <br/>
          <table style="width: 100%; text-align: left; margin-top: 20px;">
            <tr>
              <td style="width: 50%;"><b>Submitted by:</b><br/>Director-SAC<br/>Student Activity Center</td>
              <td style="width: 50%; text-align: right;"><b>Institution:</b><br/>KL Deemed to be University</td>
            </tr>
          </table>
        </div>

        <h3 class="section-header">Executive Summary</h3>
        <p>The month of May 2026 marked the official commencement of the Social Internship (Social Immersive Learning – SIL) for the Y25 Batch, while simultaneously facilitating registration, planning, software development, orientation, and deployment activities for both Y25 and Y24 Batch students.</p>
        <p>The Student Activity Center (SAC) devoted the entire month to developing a robust digital ecosystem for the internship, enabling student registrations, software automation, dashboard development, evaluation systems, awareness campaigns, documentation, village preparation, and field implementation.</p>

        <h3 class="section-header">1. Program Key Performance Indicators (KPIs)</h3>
        <!-- Infographic Style Table -->
        <table class="kpi-container">
          <tr>
            <td class="kpi-box">
              <div class="kpi-value">\${totalStudents}</div>
              <div class="kpi-label">Total Registered</div>
            </td>
            <td class="kpi-box">
              <div class="kpi-value">\${totalActive}</div>
              <div class="kpi-label">Active Students</div>
            </td>
            <td class="kpi-box" style="background-color: #F0FFF4; border-color: #9AE6B4;">
              <div class="kpi-value" style="color: #2F855A;">\${totalCompleted}</div>
              <div class="kpi-label">Completed</div>
            </td>
            <td class="kpi-box" style="background-color: #FAF5FF; border-color: #D6BCFA;">
              <div class="kpi-value" style="color: #6B46C1;">\${completionRate}</div>
              <div class="kpi-label">Success Rate</div>
            </td>
          </tr>
        </table>
        
        <h3 class="section-header">2. Slot-wise Student Deployment</h3>
        <p>The slot-based implementation enabled effective student deployment while ensuring efficient monitoring and academic supervision across various modes of participation.</p>
        <table class="data-table">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Total Students</th>
              <th>Remote Mode</th>
              <th>In-Campus Mode</th>
              <th>In-Village Mode</th>
            </tr>
          </thead>
          <tbody>
            \${slotHtml.replace(/style="[^"]*"/g, '')}
          </tbody>
        </table>

        <h3 class="section-header">3. Domain-wise Impact Areas</h3>
        <p>Students selected from various interdisciplinary domains, addressing key aspects of rural development and community transformation.</p>
        <table class="data-table">
          <thead>
            <tr>
              <th>Thematic Domain</th>
              <th>Student Participation Count</th>
            </tr>
          </thead>
          <tbody>
            \${domainHtml.replace(/style="[^"]*"/g, '')}
          </tbody>
        </table>

        <h3 class="section-header">4. Field Deployment & Logistics</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 15px; border-right: 1px solid #E2E8F0;">
              <h4 style="color: #2B6CB0; border-bottom: 2px solid #E2E8F0; padding-bottom: 5px;">In-Campus Villages (Mangalagiri)</h4>
              <ul style="color: #4A5568; line-height: 1.8;">
                <li>Kolanukonda</li>
                <li>Revendrapadu</li>
                <li>Chiluvuru</li>
                <li>Tummapudi</li>
                <li>Pedakonduru</li>
                <li>Yerrabalem</li>
                <li>Undavalli</li>
                <li>Atmakur</li>
                <li>Ratnala Cheruvu</li>
              </ul>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 15px;">
              <h4 style="color: #2B6CB0; border-bottom: 2px solid #E2E8F0; padding-bottom: 5px;">In-Village Residential</h4>
              <ul style="color: #4A5568; line-height: 1.8;">
                <li>Sitarampuram Thanda</li>
                <li>Kannimarla</li>
                <li>Edurpedu</li>
              </ul>
              <div style="background-color: #FFF5F5; padding: 15px; border-left: 4px solid #FC8181; margin-top: 20px;">
                <b>Note:</b> Students stayed within village communities, enabling direct engagement with residents and gaining first-hand understanding of local socio-economic conditions.
              </div>
            </td>
          </tr>
        </table>

        <h3 class="section-header">5. Digital Infrastructure & Systems</h3>
        <p>The SAC technical team successfully developed and deployed a comprehensive suite of digital tools:</p>
        <table style="width: 100%;">
            <tr>
                <td style="width: 50%; vertical-align: top;">
                    <ul style="color: #4A5568; line-height: 1.8;">
                      <li>Social Internship Dashboard</li>
                      <li>Student Registration Portal</li>
                      <li>Faculty Evaluation Portal</li>
                      <li>Internship Monitoring Dashboard</li>
                    </ul>
                </td>
                <td style="width: 50%; vertical-align: top;">
                    <ul style="color: #4A5568; line-height: 1.8;">
                      <li>Slot Management System</li>
                      <li>Attendance Tracking System</li>
                      <li>Student Evaluation Software</li>
                      <li>Progress Monitoring Dashboard</li>
                    </ul>
                </td>
            </tr>
        </table>

        <h3 class="section-header">6. Specialized Initiatives</h3>
        <p><b>A. Cultural Documentation</b><br/>Recognizing the importance of preserving local culture, SAC initiated the production of traditional village songs, including traditional music composition for two villages and recording of indigenous narratives.</p>
        <br/>
        <p><b>B. Community Development</b><br/>A significant infrastructure initiative was successfully completed: the installation of a Water Purification Plant in Sitarampuram Thanda, providing safe drinking water for the local community.</p>

        <h3 class="section-header">7. Outcomes Achieved</h3>
        <ul style="color: #4A5568; line-height: 1.8;">
          <li>100% student registration completed across nine operationalized slots.</li>
          <li>Twenty thematic domains actively engaged by students.</li>
          <li>Complete digital ecosystem (Dashboard and software systems) successfully launched.</li>
          <li>Documentary production and traditional village song creation initiated.</li>
        </ul>

        <br/>
        <p style="text-align: justify; font-style: italic; color: #4A5568;">The month of May 2026 laid a strong operational foundation for the successful implementation of the Social Internship programme. The groundwork established will enable effective implementation, monitoring, and evaluation of internship activities in the subsequent months.</p>

        <!-- MS Word Page Break for Gallery -->
        <br clear="all" style="page-break-before:always; mso-break-type:section-break" />

        <h2 style="text-align: center; border: none;">Visual Evidence & Gallery</h2>
        <p style="text-align: center; color: #718096;"><i>(High-resolution photographs of field activities and implementations)</i></p>
        
        <table style="width: 100%; margin-top: 30px; border-spacing: 20px; border-collapse: separate;">
          <tr>
            <td style="width: 50%; padding: 0;">
              <div style="height: 250px; background-color: #EDF2F7; border: 2px dashed #A0AEC0; text-align: center; padding-top: 110px; color: #718096; font-weight: bold;">[ Image Placeholder 1 ]</div>
              <p style="text-align: center; font-size: 10pt; margin-top: 10px; font-weight: bold; color: #2B6CB0;">Fig 1: Student Registration & Orientation</p>
            </td>
            <td style="width: 50%; padding: 0;">
              <div style="height: 250px; background-color: #EDF2F7; border: 2px dashed #A0AEC0; text-align: center; padding-top: 110px; color: #718096; font-weight: bold;">[ Image Placeholder 2 ]</div>
              <p style="text-align: center; font-size: 10pt; margin-top: 10px; font-weight: bold; color: #2B6CB0;">Fig 2: Dashboard Development Team</p>
            </td>
          </tr>
          <tr>
            <td style="width: 50%; padding: 0;">
              <div style="height: 250px; background-color: #EDF2F7; border: 2px dashed #A0AEC0; text-align: center; padding-top: 110px; color: #718096; font-weight: bold;">[ Image Placeholder 3 ]</div>
              <p style="text-align: center; font-size: 10pt; margin-top: 10px; font-weight: bold; color: #2B6CB0;">Fig 3: Field Visits & Community Interaction</p>
            </td>
            <td style="width: 50%; padding: 0;">
              <div style="height: 250px; background-color: #EDF2F7; border: 2px dashed #A0AEC0; text-align: center; padding-top: 110px; color: #718096; font-weight: bold;">[ Image Placeholder 4 ]</div>
              <p style="text-align: center; font-size: 10pt; margin-top: 10px; font-weight: bold; color: #2B6CB0;">Fig 4: Water Purification Plant Installation</p>
            </td>
          </tr>
        </table>
        
        <!-- MS Word Footer Definition -->
        <div style="mso-element:footer" id="f1">
          <p class="footer-text">
            Social Internship Progress Report | Page <span style="mso-field-code: ' PAGE '"></span> of <span style="mso-field-code: ' NUMPAGES '"></span>
          </p>
        </div>
        
      </div>
    </body>
    </html>
`;

const parts = content.split('const htmlContent = `');
if (parts.length > 1) {
    const prefix = parts[0];
    const newContent = prefix + 'const htmlContent = `' + newHtml + '`;\n\n    return NextResponse.json({ success: true, html: htmlContent });\n  } catch (error) {\n    console.error(\'Error generating report:\', error);\n    return NextResponse.json({ success: false, error: \'Failed to generate report\' }, { status: 500 });\n  }\n}\n';
    fs.writeFileSync(filePath, newContent);
    console.log('Successfully updated template');
} else {
    console.log('Failed to find split point');
}
