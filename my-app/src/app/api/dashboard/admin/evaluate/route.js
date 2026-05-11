import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { logActivity } from '@/lib/activityLog';

/* ─── Marking scheme (mirrors evaluationPlan) ─────────────────────────────── */
// Day → { maxMarks, criterion }
export const DAY_MARKS = {
  1: { max: 10, criterion: 'Problem Understanding'  },
  2: { max: 5,  criterion: 'Survey Execution (Day 2)' },
  3: { max: 5,  criterion: 'Survey Execution (Day 3)' },
  4: { max: 5,  criterion: 'Survey Execution (Day 4)' },
  5: { max: 15, criterion: 'Data Analysis'            },
  6: { max: 20, criterion: 'Intervention Activity'    },
  7: { max: 40, criterion: 'Case Study & Presentation' }, // 20 report + 20 presentation
};

async function assertAdmin(req) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;
  const decoded = await verifyAccessToken(token);
  if (!decoded || decoded.role !== 'admin') return null;
  return decoded;
}

/* ─── GET /api/dashboard/admin/evaluate ─────────────────────────────────────
   ?slot=1&day=1
   Returns { submitted: [...], notSubmitted: [...] }
   Each student has: username, name, slot, submittedAt, marks (day score), taskData
*/
export async function GET(request) {
  try {
    const decoded = await assertAdmin(request);
    if (!decoded) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const slot = searchParams.get('slot');
    const day  = searchParams.get('day');

    if (!slot || !day) {
      return NextResponse.json({ success: false, error: 'slot and day are required' }, { status: 400 });
    }

    const db = await pool.getConnection();
    try {
      // Ensure dailyMarks table has the right structure
      await db.execute(`
        CREATE TABLE IF NOT EXISTS dailyMarks (
          id       INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(255) NOT NULL UNIQUE,
          day1     DECIMAL(5,2) DEFAULT 0,
          day2     DECIMAL(5,2) DEFAULT 0,
          day3     DECIMAL(5,2) DEFAULT 0,
          day4     DECIMAL(5,2) DEFAULT 0,
          day5     DECIMAL(5,2) DEFAULT 0,
          day6     DECIMAL(5,2) DEFAULT 0,
          day7     DECIMAL(5,2) DEFAULT 0,
          evaluatedBy VARCHAR(255) DEFAULT NULL,
          updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // All students in this slot
      const [allStudents] = await db.execute(
        `SELECT r.username, r.name, r.slot, r.selectedDomain,
                COALESCE(dm.day${day}, 0) AS dayMark
         FROM registrations r
         LEFT JOIN dailyMarks dm ON r.username = dm.username
         WHERE r.slot = ? AND r.season = '2026'
         ORDER BY r.name ASC`,
        [slot]
      );

      // Students who submitted this day
      const [submittedRows] = await db.execute(
        `SELECT dt.username, dt.submittedAt, dt.data
         FROM dailyTasks dt
         JOIN registrations r ON dt.username = r.username
         WHERE r.slot = ? AND dt.day = ? AND r.season = '2026'`,
        [slot, day]
      );

      const submittedMap = {};
      submittedRows.forEach(row => {
        submittedMap[row.username] = {
          submittedAt: row.submittedAt,
          taskData: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
        };
      });

      const submitted    = [];
      const notSubmitted = [];

      allStudents.forEach(s => {
        const sub = submittedMap[s.username];
        if (sub) {
          submitted.push({
            username: s.username,
            name: s.name,
            slot: s.slot,
            selectedDomain: s.selectedDomain,
            submittedAt: sub.submittedAt,
            taskData: sub.taskData,
            dayMark: Number(s.dayMark),
            evaluated: Number(s.dayMark) > 0,
          });
        } else {
          notSubmitted.push({
            username: s.username,
            name: s.name,
            slot: s.slot,
            selectedDomain: s.selectedDomain,
            dayMark: 0,
            evaluated: false,
          });
        }
      });

      return NextResponse.json({
        success: true,
        day: Number(day),
        slot: Number(slot),
        maxMarks: DAY_MARKS[day]?.max || 10,
        criterion: DAY_MARKS[day]?.criterion || `Day ${day}`,
        submitted,
        notSubmitted,
      });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Evaluate GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

/* ─── POST /api/dashboard/admin/evaluate ────────────────────────────────────
   Body: { username, day, marks }
   Saves the mark for the given day to dailyMarks table.
*/
export async function POST(request) {
  try {
    const decoded = await assertAdmin(request);
    if (!decoded) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { username, day, marks } = await request.json();

    if (!username || !day || marks === undefined) {
      return NextResponse.json({ success: false, error: 'username, day and marks are required' }, { status: 400 });
    }

    const maxMarks = DAY_MARKS[day]?.max ?? 10;
    const mark     = Math.min(Math.max(Number(marks), 0), maxMarks);

    const db = await pool.getConnection();
    try {
      // Upsert dailyMarks row
      await db.execute(
        `INSERT INTO dailyMarks (username, day${day}, evaluatedBy)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE
           day${day}     = VALUES(day${day}),
           evaluatedBy   = VALUES(evaluatedBy),
           updatedAt     = CURRENT_TIMESTAMP`,
        [username, mark, decoded.username]
      );

      logActivity({
        action: 'ADMIN_EVALUATE_DAY_TASK',
        actorUsername: decoded.username,
        actorName:     decoded.name,
        actorRole:     'admin',
        targetUsername: username,
        details: { day, marks: mark },
      }).catch(() => {});

      return NextResponse.json({ success: true, username, day, marks: mark });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Evaluate POST error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
