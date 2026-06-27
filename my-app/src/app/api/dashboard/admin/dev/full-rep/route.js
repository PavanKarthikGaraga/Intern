import { NextResponse } from 'next/server';
import IndiaMap from "@/lib/indiaMap";
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const COMPLETED_CONDITION = `
      (
        (r.slot = 1 AND dm.day1 IS NOT NULL AND dm.day2 IS NOT NULL AND dm.day3 IS NOT NULL AND dm.day4 IS NOT NULL AND dm.day5 IS NOT NULL AND dm.day6 IS NOT NULL AND dm.day7 IS NOT NULL AND (COALESCE(dm.day1,0)+COALESCE(dm.day2,0)+COALESCE(dm.day3,0)+COALESCE(dm.day4,0)+COALESCE(dm.day5,0)+COALESCE(dm.day6,0)+COALESCE(dm.day7,0)) >= 60)
        OR
        (r.slot > 1 AND dm.day1 IS NOT NULL AND dm.day2 IS NOT NULL AND dm.day3 IS NOT NULL AND dm.day4 IS NOT NULL AND dm.day5 IS NOT NULL AND dm.day6 IS NOT NULL AND dm.day7 IS NOT NULL AND rb.reportBookMarks IS NOT NULL AND (COALESCE(dm.day1,0)+COALESCE(dm.day2,0)+COALESCE(dm.day3,0)+COALESCE(dm.day4,0)+COALESCE(dm.day5,0)+COALESCE(dm.day6,0)+COALESCE(dm.day7,0)+COALESCE(rb.reportBookMarks,0)) >= 60)
      )
    `;

    // 1. Overall Student Registration (live from DB)
    const [[overview]] = await pool.query(`
      SELECT
        COUNT(*) AS totalStudents,
        SUM(CASE WHEN ${COMPLETED_CONDITION} THEN 1 ELSE 0 END) AS totalCompleted
      FROM registrations r
      LEFT JOIN dailyMarks dm ON r.username = dm.username
      LEFT JOIN reportBooks rb ON r.username = rb.username
    `);
    const totalStudents  = Number(overview.totalStudents)  || 0;
    const totalCompleted = Number(overview.totalCompleted) || 0;
    const completionRate = totalStudents > 0
      ? ((totalCompleted / totalStudents) * 100).toFixed(2) + '%'
      : '0.00%';

    // 2. Slot-wise Student Distribution (live from DB)
    const [slotRows] = await pool.query(`
      SELECT 
        slot, 
        COUNT(*) as total,
        SUM(CASE WHEN LOWER(TRIM(COALESCE(mode,''))) IN ('remote', 'hometown') THEN 1 ELSE 0 END) as remote,
        SUM(CASE WHEN LOWER(TRIM(COALESCE(mode,''))) IN ('incampus', 'in campus', 'in-campus') THEN 1 ELSE 0 END) as incampus,
        SUM(CASE WHEN LOWER(TRIM(COALESCE(mode,''))) IN ('invillage', 'in village', 'in-village') THEN 1 ELSE 0 END) as invillage
      FROM registrations
      WHERE slot IS NOT NULL
      GROUP BY slot
      ORDER BY CAST(slot AS UNSIGNED)
    `);

    let slotHtml = '';
    for (const row of slotRows) {
      const n = parseInt(row.slot, 10);
      if (!isNaN(n) && n >= 1 && n <= 9) {
        slotHtml += `
          <tr>
            <td style="border: 1px solid black; padding: 8px;">Slot ${row.slot}</td>
            <td style="border: 1px solid black; padding: 8px;">${row.total}</td>
            <td style="border: 1px solid black; padding: 8px;">${row.remote || 0}</td>
            <td style="border: 1px solid black; padding: 8px;">${row.incampus || 0}</td>
            <td style="border: 1px solid black; padding: 8px;">${row.invillage || 0}</td>
          </tr>
        `;
      }
    }

    // 3. Domain-wise Student Participation (live from DB)
    const [domainRows] = await pool.query(`
      SELECT selectedDomain, COUNT(*) as count 
      FROM registrations 
      WHERE selectedDomain IS NOT NULL AND selectedDomain != ''
      GROUP BY selectedDomain 
      ORDER BY count DESC
    `);

    let domainHtml = '';
    for (const row of domainRows) {
      domainHtml += `
        <tr>
          <td style="border: 1px solid black; padding: 8px;">${row.selectedDomain}</td>
          <td style="border: 1px solid black; padding: 8px;">${row.count}</td>
        </tr>
      `;
    }

    
    let sacLogoBase64 = '';
    try {
      const sacLogoPath = path.join(process.cwd(), 'public', 'sac.png');
      const sacLogoData = fs.readFileSync(sacLogoPath);
      sacLogoBase64 = 'data:image/png;base64,' + sacLogoData.toString('base64');
    } catch (e) {
      console.error('Error reading sac.png', e);
    }


    // 4. State-wise Registrations
    const [stateRows] = await pool.query(`
      SELECT state, COUNT(*) as count 
      FROM registrations 
      WHERE state IS NOT NULL AND state != ''
      GROUP BY state 
      ORDER BY count DESC
    `);

    
    const maxCount = Math.max(...stateRows.map(s => s.count), 1);
    const getStateColor = (count) => {
        const ratio = count / maxCount;
        const r = Math.round(235 - ratio * (235 - 43));
        const g = Math.round(248 - ratio * (248 - 108));
        const b = Math.round(255 - ratio * (255 - 176));
        return `rgb(${r}, ${g}, ${b})`;
    };

    const stateMap = {};
    stateRows.forEach(row => {
        stateMap[row.state.trim().toLowerCase()] = row.count;
    });

    const svgPaths = IndiaMap.locations.map(loc => {
        const count = stateMap[loc.name.toLowerCase()] || 0;
        const fill = count > 0 ? getStateColor(count) : '#EDF2F7';
        return `<path d="${loc.path}" id="${loc.id}" name="${loc.name}" fill="${fill}" stroke="#CBD5E0" stroke-width="2"></path>`;
    }).join('\n');

    
    const rawSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${IndiaMap.viewBox}" width="500" height="500">
        ${svgPaths}
      </svg>`;
    const svgBase64 = Buffer.from(rawSvg).toString('base64');
    const indiaSvgHtml = `
      <div style="text-align: center;">
        <img src="data:image/svg+xml;base64,${svgBase64}" style="width: 500px; height: 500px;" alt="India Map" />
      </div>
    `;



    let galleryHtml = '';
    
    // 1. Slot-wise Gallery (1 to 6)
    for (const row of slotRows) {
      const n = parseInt(row.slot, 10);
      if (n >= 1 && n <= 6) {
        galleryHtml += `
          <h3 style="color: #2B6CB0; border-bottom: 2px solid #E2E8F0; padding-bottom: 5px; margin-top: 40px;">Slot ${n} Gallery</h3>
          <p>
            <b>Total Registered:</b> ${row.total} | 
            <b>Remote:</b> ${row.remote || 0} | 
            <b>In-Campus:</b> ${row.incampus || 0} | 
            <b>In-Village:</b> ${row.invillage || 0}
          </p>
          <table style="width: 100%; margin-top: 15px; border-spacing: 20px; border-collapse: separate;">
            <tr>
              <td style="width: 50%; padding: 0;">
                <div style="height: 200px; background-color: #EDF2F7; border: 2px dashed #A0AEC0; text-align: center; padding-top: 85px; color: #718096; font-weight: bold;">[ Slot ${n} Photo 1 ]</div>
              </td>
              <td style="width: 50%; padding: 0;">
                <div style="height: 200px; background-color: #EDF2F7; border: 2px dashed #A0AEC0; text-align: center; padding-top: 85px; color: #718096; font-weight: bold;">[ Slot ${n} Photo 2 ]</div>
              </td>
            </tr>
            <tr>
              <td style="width: 50%; padding: 0;">
                <div style="height: 200px; background-color: #EDF2F7; border: 2px dashed #A0AEC0; text-align: center; padding-top: 85px; color: #718096; font-weight: bold;">[ Slot ${n} Photo 3 ]</div>
              </td>
              <td style="width: 50%; padding: 0;">
                <div style="height: 200px; background-color: #EDF2F7; border: 2px dashed #A0AEC0; text-align: center; padding-top: 85px; color: #718096; font-weight: bold;">[ Slot ${n} Photo 4 ]</div>
              </td>
            </tr>
          </table>
        `;
      }
    }

    
    // 2. States Involved Section
    
    let legendHtml = `<table style="width:100%; border-collapse: collapse; font-size: 14px;">
      <tr><th style="text-align:left; border-bottom:1px solid #CBD5E0; padding: 5px;">State</th><th style="text-align:right; border-bottom:1px solid #CBD5E0; padding: 5px;">Students</th></tr>`;
    
    stateRows.forEach(row => {
        const count = row.count;
        const color = count > 0 ? getStateColor(count) : '#EDF2F7';
        legendHtml += `<tr>
            <td style="padding: 5px; border-bottom:1px solid #EDF2F7;">
              <span style="display:inline-block; width:12px; height:12px; background-color:${color}; margin-right:8px; border:1px solid #CBD5E0;"></span>${row.state}
            </td>
            <td style="padding: 5px; border-bottom:1px solid #EDF2F7; text-align:right;"><b>${count}</b></td>
        </tr>`;
    });
    legendHtml += `</table>`;

    galleryHtml += `
        <br clear="all" style="page-break-before:always; mso-break-type:page-break" />
        <h3 class="section-header">States Involved in the Social Internship</h3>
        
        <table style="width: 100%; margin: 30px 0;">
          <tr>
            <td style="width: 60%; text-align: center; vertical-align: top;">
              ${indiaSvgHtml}
            </td>
            <td style="width: 40%; vertical-align: top; padding-left: 20px; background-color: #F7FAFC; border: 1px solid #E2E8F0; padding: 15px;">
              <h4 style="margin-top:0; color: #2D3748; border-bottom: 2px solid #E2E8F0; padding-bottom: 10px;">Registrations by State</h4>
              ${legendHtml}
            </td>
          </tr>
        </table>
    `;

    // 3. State-wise Photos

    for (const stateRow of stateRows) {
        galleryHtml += `
          <h4 style="color: #2B6CB0; margin-top: 30px;">${stateRow.state} (${stateRow.count} Students)</h4>
          <table style="width: 100%; border-spacing: 20px; border-collapse: separate;">
            <tr>
              <td style="width: 50%; padding: 0;">
                <div style="height: 200px; background-color: #EDF2F7; border: 2px dashed #A0AEC0; text-align: center; padding-top: 85px; color: #718096; font-weight: bold;">[ ${stateRow.state} Photo 1 ]</div>
              </td>
              <td style="width: 50%; padding: 0;">
                <div style="height: 200px; background-color: #EDF2F7; border: 2px dashed #A0AEC0; text-align: center; padding-top: 85px; color: #718096; font-weight: bold;">[ ${stateRow.state} Photo 2 ]</div>
              </td>
            </tr>
          </table>
        `;
    }

    const htmlContent = `
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
      
        
        <div class="header-title" style="border: none; margin-top: 50px;">
          <h1 style="font-size: 36pt; text-transform: uppercase; margin: 0; color: #2B6CB0; text-align: center;">STUDENT ACTIVITY CENTER<br/>(SAC)</h1>
          <h2 style="font-size: 24pt; margin: 20px 0; color: #4A5568; text-align: center;">Social Internship</h2>
          <p style="font-size: 18pt; color: #718096; font-style: italic; text-align: center;">Monthly Progress Report - May 2026</p>
          
          <div style="text-align: center; margin: 60px 0;">
            <img src="${sacLogoBase64}" alt="SAC Logo" style="width: 250px; height: auto;" />
          </div>

          <table style="width: 100%; text-align: center; margin-top: 80px; font-size: 16pt; color: #4A5568;">
            <tr>
              <td style="width: 50%; vertical-align: top;">
                <b>Submitted by:</b><br/>Director-SAC<br/>Student Activity Center
              </td>
              <td style="width: 50%; vertical-align: top;">
                <b>Institution:</b><br/>KL Deemed to be University
              </td>
            </tr>
          </table>
        </div>
        
        <!-- MS Word Page Break -->
        <br clear="all" style="page-break-before:always; mso-break-type:page-break" />


        <h3 class="section-header">Executive Summary</h3>
        <p>The month of May 2026 marked the official commencement of the Social Internship (Social Immersive Learning – SIL) for the Y25 Batch, while simultaneously facilitating registration, planning, software development, orientation, and deployment activities for both Y25 and Y24 Batch students.</p>
        <p>The Student Activity Center (SAC) devoted the entire month to developing a robust digital ecosystem for the internship, enabling student registrations, software automation, dashboard development, evaluation systems, awareness campaigns, documentation, village preparation, and field implementation.</p>
        <p>The internship aims to cultivate experiential learning by engaging students in solving real-world rural and urban challenges through community participation and sustainable development initiatives aligned with national priorities and the Sustainable Development Goals (SDGs).</p>

        <h3 class="section-header">1. Major Activities Undertaken During May 2026</h3>
        <p>The Student Activity Center successfully completed the following major milestones:</p>
        
        <h4 style="color: #2B6CB0; margin-top: 15px; margin-bottom: 5px;">Administrative Activities</h4>
        <ul style="color: #4A5568; line-height: 1.8;">
          <li>Registration process for Y25 Batch Social Internship.</li>
          <li>Registration support for Y24 Batch students.</li>
          <li>Student verification and domain allotment.</li>
          <li>Slot-wise scheduling and deployment planning.</li>
          <li>Faculty mentor coordination.</li>
          <li>Internship operational planning.</li>
        </ul>

        <h4 style="color: #2B6CB0; margin-top: 15px; margin-bottom: 5px;">Digital Infrastructure Development</h4>
        <p>The SAC technical team successfully developed:</p>
        <ul style="color: #4A5568; line-height: 1.8; column-count: 2;">
          <li>Social Internship Dashboard</li>
          <li>Student Registration Portal</li>
          <li>Faculty Evaluation Portal</li>
          <li>Internship Monitoring Dashboard</li>
          <li>Slot Management System</li>
          <li>Attendance Tracking System</li>
          <li>Student Evaluation Software</li>
          <li>Progress Monitoring Dashboard</li>
        </ul>
        <p>The software enables real-time monitoring of students, faculty mentors, domains, villages, attendance, submissions, and internship evaluation.</p>

        <h3 class="section-header">2. Awareness & Orientation Activities</h3>
        <p>During the first and second weeks of May, extensive awareness activities were conducted. These included:</p>
        <ul style="color: #4A5568; line-height: 1.8; column-count: 2;">
          <li>Student orientation sessions</li>
          <li>Internship awareness campaigns</li>
          <li>Domain awareness videos</li>
          <li>Registration tutorial videos</li>
          <li>Faculty training sessions</li>
          <li>Dashboard usage demonstrations</li>
          <li>Evaluation process orientation</li>
          <li>Guidelines for report preparation</li>
          <li>Documentation standards</li>
          <li>Internship workflow videos</li>
        </ul>
        <p>These initiatives ensured that students clearly understood the objectives, methodology, expected outcomes, and evaluation procedures before the commencement of field activities.</p>

        <h3 class="section-header">3. Student Registration Statistics</h3>
        <p><b>Overall Student Registration</b></p>
        <!-- Infographic Style Table -->
        <table class="kpi-container">
          <tr>
            <td class="kpi-box">
              <div class="kpi-value">${totalStudents}</div>
              <div class="kpi-label">Total Registered</div>
            </td>
            <td class="kpi-box">
              <div class="kpi-value">${totalStudents}</div>
              <div class="kpi-label">Active Students</div>
            </td>
            <td class="kpi-box" style="background-color: #F0FFF4; border-color: #9AE6B4;">
              <div class="kpi-value" style="color: #2F855A;">${totalCompleted}</div>
              <div class="kpi-label">Completed</div>
            </td>
            <td class="kpi-box" style="background-color: #FAF5FF; border-color: #D6BCFA;">
              <div class="kpi-value" style="color: #6B46C1;">${completionRate}</div>
              <div class="kpi-label">Completion Rate</div>
            </td>
          </tr>
        </table>
        <p>The complete student strength was successfully onboarded into the Social Internship portal during May 2026.</p>
        
        <h3 class="section-header">4. Slot-wise Student Distribution</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Slot</th>
              <th>Total</th>
              <th>Remote</th>
              <th>In Campus</th>
              <th>In Village</th>
            </tr>
          </thead>
          <tbody>
            ${slotHtml.replace(/style="[^"]*"/g, '')}
          </tbody>
        </table>
        <p>The slot-based implementation enabled effective student deployment while ensuring efficient monitoring and academic supervision.</p>

        <h3 class="section-header">5. Domain-wise Student Participation</h3>
        <p>Students selected from 20 interdisciplinary domains, addressing key aspects of rural development and community transformation.</p>
        <table class="data-table">
          <thead>
            <tr>
              <th>Domain</th>
              <th>Students</th>
            </tr>
          </thead>
          <tbody>
            ${domainHtml.replace(/style="[^"]*"/g, '')}
          </tbody>
        </table>
        <p>Agriculture emerged as the most preferred domain, reflecting students' strong interest in addressing agricultural productivity, sustainability, and rural livelihoods.</p>

        <h3 class="section-header">6. Geographic Outreach</h3>
        <p>The internship extended beyond a single geographical location, with participation from students residing across:</p>
        <ul style="color: #4A5568; line-height: 1.8;">
          <li>Multiple districts of Andhra Pradesh</li>
          <li>Various Indian states</li>
          <li>International locations where students completed the internship through the approved Remote Mode</li>
        </ul>
        <p>This diverse participation significantly enhanced the outreach and inclusiveness of the Social Internship programme.</p>

        <h3 class="section-header">7. Internship Implementation Areas</h3>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="width: 50%; vertical-align: top; padding-right: 15px; border-right: 1px solid #E2E8F0;">
              <h4 style="color: #2B6CB0; border-bottom: 2px solid #E2E8F0; padding-bottom: 5px;">In-Campus Villages (Mangalagiri Constituency)</h4>
              <p>Field activities commenced across the following villages:</p>
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
              <p>Students undertook community surveys, stakeholder interactions, needs assessments, and domain-specific studies in these villages.</p>
            </td>
            <td style="width: 50%; vertical-align: top; padding-left: 15px;">
              <h4 style="color: #2B6CB0; border-bottom: 2px solid #E2E8F0; padding-bottom: 5px;">In-Village Residential Internship</h4>
              <p>Residential immersion activities were carried out in:</p>
              <ul style="color: #4A5568; line-height: 1.8;">
                <li>Sitarampuram Thanda</li>
                <li>Kannimarla</li>
                <li>Edurpedu</li>
              </ul>
              <div style="background-color: #FFF5F5; padding: 15px; border-left: 4px solid #FC8181; margin-top: 20px;">
                Students stayed within village communities, enabling direct engagement with residents and gaining first-hand understanding of local socio-economic conditions.
              </div>
            </td>
          </tr>
        </table>

        <h3 class="section-header">8. Media, Documentation & Knowledge Creation</h3>
        <p>To preserve local heritage and document field experiences, the Student Activity Center undertook several creative initiatives. These included:</p>
        <ul style="color: #4A5568; line-height: 1.8;">
          <li>Documentary production in five villages.</li>
          <li>Village documentation.</li>
          <li>Community storytelling.</li>
          <li>Recording of local traditions and practices.</li>
          <li>Collection of success stories.</li>
          <li>Visual documentation of developmental initiatives.</li>
        </ul>
        <p>These documentaries will serve as long-term educational resources for future student batches.</p>

        <h3 class="section-header">9. Cultural Documentation Initiative</h3>
        <p>Recognizing the importance of preserving local culture, SAC initiated the production of traditional village songs. Achievements include:</p>
        <ul style="color: #4A5568; line-height: 1.8;">
          <li>Traditional music composition for two villages.</li>
          <li>Documentation of local cultural heritage.</li>
          <li>Recording of indigenous narratives.</li>
          <li>Promotion of community identity through music.</li>
        </ul>

        <h3 class="section-header">10. Community Development Initiative</h3>
        <p>A significant infrastructure initiative was successfully completed during May.</p>
        <p><b>Installation of Water Purification Plant</b><br/>Location: Sitarampuram Thanda</p>
        <p>The initiative was undertaken to improve access to safe drinking water for the local community and represents a tangible outcome of the Social Internship programme's commitment to sustainable rural development.</p>

        <h3 class="section-header">11. Outcomes Achieved During May</h3>
        <p>The following milestones were successfully achieved:</p>
        <ul style="color: #4A5568; line-height: 1.8; column-count: 2;">
          <li>100% student registration completed.</li>
          <li>Nine internship slots finalized.</li>
          <li>Twenty thematic domains operationalized.</li>
          <li>Dashboard and software systems developed.</li>
          <li>Evaluation platform implemented.</li>
          <li>Faculty coordination completed.</li>
          <li>Awareness programmes conducted.</li>
          <li>Documentary production initiated.</li>
          <li>Traditional village songs created.</li>
          <li>Water purification plant established.</li>
          <li>Village implementation successfully launched.</li>
        </ul>

        <br/>
        <p style="text-align: justify; color: #4A5568;">The month of May 2026 laid a strong operational foundation for the successful implementation of the Social Internship programme. Through meticulous planning, digital infrastructure development, student mobilization, field deployment, and community engagement, the Student Activity Center ensured the programme commenced in a structured and impactful manner.</p>
        <p style="text-align: justify; color: #4A5568;">The initiatives undertaken during this period demonstrate the University's commitment to experiential learning, rural transformation, community participation, and sustainable development. The groundwork established in May will enable effective implementation, monitoring, and evaluation of internship activities in the subsequent months.</p>


        <!-- MS Word Page Break for Gallery -->
        <br clear="all" style="page-break-before:always; mso-break-type:section-break" />

        
        <h2 style="text-align: center; border: none;">Visual Evidence & Gallery</h2>
        <p style="text-align: center; color: #718096;"><i>(High-resolution photographs of field activities and implementations)</i></p>
        
        ${galleryHtml}

        
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

    return NextResponse.json({ success: true, html: htmlContent });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}
