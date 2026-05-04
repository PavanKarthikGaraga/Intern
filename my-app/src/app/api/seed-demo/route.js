/**
 * POST /api/seed-demo
 * One-shot admin-only endpoint to seed the demo student (2500099999).
 * Idempotent — safe to call multiple times.
 */
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

const DEMO_ID = '2500099999';
const DEMO_PHONE = '9999000001';

const DAILY_TASKS = {
  1: {
    location: 'KL University Campus, Guntur',
    problemUnderstanding: 'Smallholder farmers in Andhra Pradesh lack access to timely, accurate crop disease diagnosis. Current methods rely on manual inspection which is slow and error-prone, leading to significant crop loss annually.',
    rootCause: 'Limited agricultural extension services, poor internet penetration in rural areas, and absence of affordable AI tools tailored for local crop varieties.',
    inference: 'An AI-based mobile application trained on local field imagery could reduce crop loss by up to 40% if adopted at scale.',
  },
  2: {
    surveyTarget: 'Farmers, Agricultural Officers',
    totalSurveyed: 30,
    responses: [
      { question: 'Do you use any digital tool for crop disease detection?', yes: 3, no: 27 },
      { question: 'Are you willing to learn a smartphone app if it helps?', yes: 22, no: 8 },
      { question: 'Have you experienced major crop loss due to disease?', yes: 26, no: 4 },
    ],
  },
  3: {
    surveyTarget: 'Students, Agri-Tech Professionals',
    totalSurveyed: 25,
    responses: [
      { question: 'Are you aware of ML-based crop disease detection tools?', yes: 18, no: 7 },
      { question: 'Would you recommend such tools to rural farmers?', yes: 23, no: 2 },
    ],
  },
  4: {
    surveyTarget: 'Village Panchayat Members, Self-Help Groups',
    totalSurveyed: 20,
    responses: [
      { question: 'Is internet connectivity adequate in your village?', yes: 6, no: 14 },
      { question: 'Would offline AI tools be useful?', yes: 19, no: 1 },
    ],
  },
  5: {
    yesPercentages: { Q1: 10, Q2: 73, Q3: 87, Q4: 24, Q5: 95 },
    noPercentages:  { Q1: 90, Q2: 27, Q3: 13, Q4: 76, Q5: 5  },
    rootCauses: [
      'Poor digital literacy among older farmers',
      'Lack of local-language AI tools',
      'No consistent internet in rural zones',
      'High cost of smart devices',
    ],
    analysis: 'Over 87% of farmers have experienced crop loss yet only 10% use any digital solution, indicating a massive unmet need. Offline-capable AI tools in Telugu would have the highest adoption probability.',
  },
  6: {
    activityTitle: 'AI Crop Disease Awareness Camp',
    activityDate: '2026-05-16',
    location: 'Nadendla Village, Guntur District',
    participants: 45,
    description: 'Conducted a hands-on demonstration of the prototype ML app trained on 5000+ local crop images. Farmers photographed diseased leaves and received instant diagnosis. Distributed printed guides in Telugu.',
    driveLink: 'https://drive.google.com/drive/folders/demo_intervention_folder',
    photos: ['photo1.jpg', 'photo2.jpg'],
  },
  7: {
    reportTitle: 'AI-Powered Crop Disease Detection for Rural Andhra Pradesh',
    abstract: 'This case study documents a 7-day field internship investigating the feasibility of deploying ML-based crop disease detection in rural Guntur district. Survey data from 75 respondents and a live intervention camp reveal strong unmet demand and a viable technology pathway.',
    methodology: 'Mixed-methods: structured surveys, stakeholder interviews, and prototype demonstration.',
    findings: 'Local farmers overwhelmingly prefer offline, Telugu-language tools; 95% expressed willingness to adopt given free or subsidised access.',
    recommendations: 'Partner with KVKs to deploy offline-first Android app; integrate with PM-Kisan database for farmer targeting.',
    youtubeLink: 'https://youtube.com/watch?v=demo_presentation',
    driveLink: 'https://drive.google.com/drive/folders/demo_final_report',
  },
};

export async function POST() {
  try {
    // Auth guard — admin only
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const decoded = await verifyAccessToken(token);
    if (decoded.role !== 'admin') return NextResponse.json({ error: 'Admin only' }, { status: 403 });

    const db = await pool.getConnection();
    try {
      const passwordHash = await bcrypt.hash(`${DEMO_ID}${DEMO_PHONE.slice(-4)}`, 10);

      // ── 1. users ──────────────────────────────────────────────────────────────
      await db.query(
        `INSERT INTO users (name, username, password, role)
         VALUES (?, ?, ?, 'student')
         ON DUPLICATE KEY UPDATE name=VALUES(name), password=VALUES(password)`,
        ['Demo Student', DEMO_ID, passwordHash]
      );

      // ── 2. registrations ─────────────────────────────────────────────────────
      await db.query(
        `INSERT INTO registrations
           (selectedDomain, fieldOfInterest, careerChoice, batch, mode, slot, username, name, email,
            branch, gender, year, phoneNumber, residenceType, hostelName, busRoute,
            country, state, district, pincode, season,
            facultyMentorId, studentLeadId, accommodation, transportation)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           selectedDomain=VALUES(selectedDomain), mode=VALUES(mode), slot=VALUES(slot),
           name=VALUES(name), email=VALUES(email)`,
        [
          'Machine Learning & AI', 'Data Science', 'Software Engineer', '2022-2026',
          'Incampus', 1, DEMO_ID, 'Demo Student', 'demo@kluniversity.in',
          'Computer Science & Engineering', 'Male', '3rd', DEMO_PHONE,
          'Hostel', 'KL Boys Hostel A', null,
          'India', 'Andhra Pradesh', 'Guntur', '522502', '2026',
          null, null, null, null
        ]
      );

      // ── 3. problemStatements ─────────────────────────────────────────────────
      await db.query(
        `INSERT INTO problemStatements (username, domain, problem_statement, location, district, state)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE problem_statement=VALUES(problem_statement)`,
        [
          DEMO_ID, 'Machine Learning & AI',
          'Analysing the impact of AI-driven crop disease detection tools on smallholder farmers in rural Andhra Pradesh using ML models trained on local field imagery.',
          'KL University Campus', 'Guntur', 'Andhra Pradesh'
        ]
      );

      // ── 3.5 Dummy Faculty Mentor ─────────────────────────────────────────────
      await db.query(
        `INSERT INTO users (name, username, password, role)
         VALUES ('Demo Mentor', 'DEMO_M', 'password123', 'facultyMentor')
         ON DUPLICATE KEY UPDATE name='Demo Mentor'`
      );
      await db.query(
        `INSERT INTO facultyMentors (username, name, phoneNumber, email, branch)
         VALUES ('DEMO_M', 'Demo Mentor', '9999000002', 'mentor@kluniversity.in', 'Computer Science & Engineering')
         ON DUPLICATE KEY UPDATE name='Demo Mentor'`
      );

      // ── 4. marks ─────────────────────────────────────────────────────────────
      await db.query(
        `INSERT INTO marks (username, facultyMentorId, internalMarks, finalReport, finalPresentation, grade, completed)
         VALUES (?, 'DEMO_M', 92, 19, 18, 'A', 'P')
         ON DUPLICATE KEY UPDATE facultyMentorId='DEMO_M', internalMarks=92, finalReport=19, finalPresentation=18, grade='A', completed='P'`
        , [DEMO_ID]
      );

      // ── 5. final ─────────────────────────────────────────────────────────────
      await db.query(
        `INSERT INTO final (username, completed) VALUES (?, 1)
         ON DUPLICATE KEY UPDATE completed=1`,
        [DEMO_ID]
      );

      // ── 6. verify ────────────────────────────────────────────────────────────
      await db.query(
        `INSERT INTO verify (username, day1, day2, day3, day4, day5, day6, day7)
         VALUES (?, true, true, true, true, true, true, true)
         ON DUPLICATE KEY UPDATE
           day1=true, day2=true, day3=true, day4=true, day5=true, day6=true, day7=true`,
        [DEMO_ID]
      );

      // ── 7. attendance ────────────────────────────────────────────────────────
      await db.query(
        `INSERT INTO attendance (username, day1, day2, day3, day4, day5, day6, day7)
         VALUES (?, 'Present','Present','Present','Present','Present','Present','Present')
         ON DUPLICATE KEY UPDATE
           day1='Present', day2='Present', day3='Present', day4='Present',
           day5='Present', day6='Present', day7='Present'`,
        [DEMO_ID]
      );

      // ── 8. dailyTasks — all 7 days ───────────────────────────────────────────
      await db.query(`
        CREATE TABLE IF NOT EXISTS dailyTasks (
          id          INT          AUTO_INCREMENT PRIMARY KEY,
          username    VARCHAR(255) NOT NULL,
          day         TINYINT      NOT NULL,
          data        JSON         NOT NULL,
          submittedAt TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
          updatedAt   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY uq_user_day (username, day)
        )
      `);

      for (const [day, taskData] of Object.entries(DAILY_TASKS)) {
        await db.query(
          `INSERT INTO dailyTasks (username, day, data)
           VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE data=VALUES(data), updatedAt=CURRENT_TIMESTAMP`,
          [DEMO_ID, parseInt(day), JSON.stringify(taskData)]
        );
      }

      // ── 9. slotControl — enable Slot 1 ──────────────────────────────────────
      await db.query(
        `INSERT INTO slotControl (slot, enabled) VALUES (1, 1)
         ON DUPLICATE KEY UPDATE enabled=1`
      );

      return NextResponse.json({
        success: true,
        message: 'Demo student 2500099999 seeded successfully.',
        login: { username: DEMO_ID, password: `${DEMO_ID}${DEMO_PHONE.slice(-4)}` },
      });
    } finally { db.release(); }
  } catch (e) {
    console.error('Seed error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
