import { NextResponse } from 'next/server';
import { defaultPool as pool } from '@/lib/db'; // Explicitly use defaultPool if we want, or just `import pool from`

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const activePool = (await import('@/lib/db')).default;

    // 1. Overall Student Registration
    const [[{ totalStudents }]] = await activePool.query('SELECT COUNT(*) as totalStudents FROM registrations');
    const totalCompleted = 0; // Keeping as 0 based on user's template
    const completionRate = '0%';

    // 2. Slot-wise Student Distribution
    const [slotRows] = await activePool.query(`
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

    // 3. Domain-wise Student Participation
    const [domainRows] = await activePool.query(`
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

    const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head><meta charset='utf-8'><title>Social Internship Report</title></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; border: 2px solid #000; max-width: 800px; margin: 0 auto; min-height: 1122px; position: relative;">
      
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2c3e50; font-size: 24px; text-transform: uppercase;">Student Activity Center (SAC)</h1>
        <h2 style="color: #2980b9; font-size: 22px;">Social Internship</h2>
        <h3 style="font-size: 18px; color: #555;">Monthly Progress Report – May 2026</h3>
        <br/><br/>
        <p style="font-weight: bold;">Submitted by:</p>
        <p>Director-SAC<br/>Student Activity Center (SAC)<br/>KL Deemed to be University</p>
      </div>

      <hr style="border-top: 2px solid #000; margin: 30px 0;"/>

      <h2 style="text-align: center; text-decoration: underline;">MONTHLY REPORT</h2>
      <h3 style="text-align: center;">Social Internship – May 2026</h3>

      <h3 style="color: #2c3e50; border-bottom: 1px solid #ccc; padding-bottom: 5px;">Executive Summary</h3>
      <p>The month of May 2026 marked the official commencement of the Social Internship (Social Immersive Learning – SIL) for the Y25 Batch, while simultaneously facilitating registration, planning, software development, orientation, and deployment activities for both Y25 and Y24 Batch students.</p>
      <p>The Student Activity Center (SAC) devoted the entire month to developing a robust digital ecosystem for the internship, enabling student registrations, software automation, dashboard development, evaluation systems, awareness campaigns, documentation, village preparation, and field implementation.</p>
      <p>The internship aims to cultivate experiential learning by engaging students in solving real-world rural and urban challenges through community participation and sustainable development initiatives aligned with national priorities and the Sustainable Development Goals (SDGs).</p>

      <h3 style="color: #2c3e50; border-bottom: 1px solid #ccc; padding-bottom: 5px;">1. Major Activities Undertaken During May 2026</h3>
      <p>The Student Activity Center successfully completed the following major milestones:</p>
      
      <h4 style="margin-bottom: 5px;">Administrative Activities</h4>
      <ul style="margin-top: 0;">
        <li>Registration process for Y25 Batch Social Internship.</li>
        <li>Registration support for Y24 Batch students.</li>
        <li>Student verification and domain allotment.</li>
        <li>Slot-wise scheduling and deployment planning.</li>
        <li>Faculty mentor coordination.</li>
        <li>Internship operational planning.</li>
      </ul>

      <h4 style="margin-bottom: 5px;">Digital Infrastructure Development</h4>
      <p style="margin-top: 0;">The SAC technical team successfully developed:</p>
      <ul>
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

      <h3 style="color: #2c3e50; border-bottom: 1px solid #ccc; padding-bottom: 5px;">2. Awareness & Orientation Activities</h3>
      <p>During the first and second weeks of May, extensive awareness activities were conducted. These included:</p>
      <ul>
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

      <h3 style="color: #2c3e50; border-bottom: 1px solid #ccc; padding-bottom: 5px;">3. Student Registration Statistics</h3>
      <p><b>Overall Student Registration</b></p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid black; padding: 8px; text-align: left;">Particular</th>
            <th style="border: 1px solid black; padding: 8px; text-align: left;">Count</th>
          </tr>
        </thead>
        <tbody>
          <tr><td style="border: 1px solid black; padding: 8px;">Total Registered Students</td><td style="border: 1px solid black; padding: 8px;">${totalStudents}</td></tr>
          <tr><td style="border: 1px solid black; padding: 8px;">Active Students</td><td style="border: 1px solid black; padding: 8px;">${totalStudents}</td></tr>
          <tr><td style="border: 1px solid black; padding: 8px;">Completed Students</td><td style="border: 1px solid black; padding: 8px;">${totalCompleted}</td></tr>
          <tr><td style="border: 1px solid black; padding: 8px;">Completion Rate</td><td style="border: 1px solid black; padding: 8px;">${completionRate}</td></tr>
        </tbody>
      </table>
      <p>The complete student strength was successfully onboarded into the Social Internship portal during May 2026.</p>

      <h3 style="color: #2c3e50; border-bottom: 1px solid #ccc; padding-bottom: 5px;">4. Slot-wise Student Distribution</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid black; padding: 8px; text-align: left;">Slot</th>
            <th style="border: 1px solid black; padding: 8px; text-align: left;">Total</th>
            <th style="border: 1px solid black; padding: 8px; text-align: left;">Remote</th>
            <th style="border: 1px solid black; padding: 8px; text-align: left;">In Campus</th>
            <th style="border: 1px solid black; padding: 8px; text-align: left;">In Village</th>
          </tr>
        </thead>
        <tbody>
          ${slotHtml}
        </tbody>
      </table>
      <p>The slot-based implementation enabled effective student deployment while ensuring efficient monitoring and academic supervision.</p>

      <h3 style="color: #2c3e50; border-bottom: 1px solid #ccc; padding-bottom: 5px;">5. Domain-wise Student Participation</h3>
      <p>Students selected from various interdisciplinary domains, addressing key aspects of rural development and community transformation.</p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th style="border: 1px solid black; padding: 8px; text-align: left;">Domain</th>
            <th style="border: 1px solid black; padding: 8px; text-align: left;">Students</th>
          </tr>
        </thead>
        <tbody>
          ${domainHtml}
        </tbody>
      </table>
      <p>Agriculture emerged as the most preferred domain, reflecting students' strong interest in addressing agricultural productivity, sustainability, and rural livelihoods.</p>

      <h3 style="color: #2c3e50; border-bottom: 1px solid #ccc; padding-bottom: 5px;">6. Geographic Outreach</h3>
      <p>The internship extended beyond a single geographical location, with participation from students residing across:</p>
      <ul>
        <li>Multiple districts of Andhra Pradesh</li>
        <li>Various Indian states</li>
        <li>International locations where students completed the internship through the approved Remote Mode</li>
      </ul>
      <p>This diverse participation significantly enhanced the outreach and inclusiveness of the Social Internship programme.</p>

      <h3 style="color: #2c3e50; border-bottom: 1px solid #ccc; padding-bottom: 5px;">7. Internship Implementation Areas</h3>
      <h4 style="margin-bottom: 5px;">In-Campus Villages (Mangalagiri Constituency)</h4>
      <p style="margin-top: 0;">Field activities commenced across the following villages:</p>
      <ul>
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

      <h4 style="margin-bottom: 5px;">In-Village Residential Internship</h4>
      <p style="margin-top: 0;">Residential immersion activities were carried out in:</p>
      <ul>
        <li>Sitarampuram Thanda</li>
        <li>Kannimarla</li>
        <li>Edurpedu</li>
      </ul>
      <p>Students stayed within village communities, enabling direct engagement with residents and gaining first-hand understanding of local socio-economic conditions.</p>

      <h3 style="color: #2c3e50; border-bottom: 1px solid #ccc; padding-bottom: 5px;">8. Media, Documentation & Knowledge Creation</h3>
      <p>To preserve local heritage and document field experiences, the Student Activity Center undertook several creative initiatives. These included:</p>
      <ul>
        <li>Documentary production in five villages.</li>
        <li>Village documentation.</li>
        <li>Community storytelling.</li>
        <li>Recording of local traditions and practices.</li>
        <li>Collection of success stories.</li>
        <li>Visual documentation of developmental initiatives.</li>
      </ul>
      <p>These documentaries will serve as long-term educational resources for future student batches.</p>

      <h3 style="color: #2c3e50; border-bottom: 1px solid #ccc; padding-bottom: 5px;">9. Cultural Documentation Initiative</h3>
      <p>Recognizing the importance of preserving local culture, SAC initiated the production of traditional village songs. Achievements include:</p>
      <ul>
        <li>Traditional music composition for two villages.</li>
        <li>Documentation of local cultural heritage.</li>
        <li>Recording of indigenous narratives.</li>
        <li>Promotion of community identity through music.</li>
      </ul>

      <h3 style="color: #2c3e50; border-bottom: 1px solid #ccc; padding-bottom: 5px;">10. Community Development Initiative</h3>
      <p>A significant infrastructure initiative was successfully completed during May.</p>
      <p><b>Installation of Water Purification Plant</b><br/>
      Location: Sitarampuram Thanda</p>
      <p>The initiative was undertaken to improve access to safe drinking water for the local community and represents a tangible outcome of the Social Internship programme's commitment to sustainable rural development.</p>

      <h3 style="color: #2c3e50; border-bottom: 1px solid #ccc; padding-bottom: 5px;">11. Outcomes Achieved During May</h3>
      <p>The following milestones were successfully achieved:</p>
      <ul>
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

      <hr style="border-top: 1px solid #ccc; margin: 30px 0;"/>

      <p>The month of May 2026 laid a strong operational foundation for the successful implementation of the Social Internship programme. Through meticulous planning, digital infrastructure development, student mobilization, field deployment, and community engagement, the Student Activity Center ensured the programme commenced in a structured and impactful manner.</p>
      <p>The initiatives undertaken during this period demonstrate the University's commitment to experiential learning, rural transformation, community participation, and sustainable development. The groundwork established in May will enable effective implementation, monitoring, and evaluation of internship activities in the subsequent months.</p>

      <h2 style="text-align: center; page-break-before: always; margin-top: 50px;">Gallery (Photographs)</h2>
      <p style="text-align: center; color: #888;"><i>(Space reserved for high-resolution photographs with captions)</i></p>
      <div style="height: 400px; border: 2px dashed #ccc; margin: 20px 0; display: flex; align-items: center; justify-content: center;">
        <span style="color: #aaa;">[ Insert Images Here ]</span>
      </div>
      
      <h4>Suggested photographs:</h4>
      <ul>
        <li>Student Registration Process</li>
        <li>Social Internship Orientation Programme</li>
        <li>Dashboard Development Team</li>
        <li>Software Development & Evaluation Portal</li>
        <li>Student Awareness Sessions</li>
        <li>Documentary Shoot in Villages</li>
        <li>Traditional Song Recording</li>
        <li>Water Purification Plant – Sitarampuram Thanda</li>
        <li>Field Visits – Kolanukonda</li>
        <li>Revendrapadu Activities</li>
        <li>Chiluvuru Village Survey</li>
        <li>Tummapudi Community Interaction</li>
        <li>Pedakonduru Field Study</li>
        <li>Yerrabalem Village Visit</li>
        <li>Undavalli Community Survey</li>
        <li>Atmakur Field Activities</li>
        <li>Ratnala Cheruvu Survey</li>
        <li>Sitarampuram Thanda Residential Internship</li>
        <li>Kannimarla Field Engagement</li>
        <li>Edurpedu Village Activities</li>
        <li>Faculty Monitoring Visits</li>
        <li>Student Group Discussions</li>
        <li>Community Stakeholder Meetings</li>
        <li>Internship Launch Activities</li>
      </ul>

    </body>
    </html>
    `;

    return NextResponse.json({ success: true, html: htmlContent });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}
