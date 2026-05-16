import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import { surveyData as SURVEY } from '@/app/(pages)/dashboard/student/_components/dailyTasks/surveyDataShared';

async function assertAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return null;
  const decoded = await verifyAccessToken(token);
  if (!decoded || decoded.role !== 'admin') return null;
  return decoded;
}

// Slot 1: May 11 – May 17, 2026
const SLOT_DATES = {
  1: { start: '2026-05-11', end: '2026-05-17', label: 'Slot 1 (May 11 – 17, 2026)' },
  2: { start: '2026-05-18', end: '2026-05-24', label: 'Slot 2 (May 18 – 24, 2026)' },
  3: { start: '2026-05-25', end: '2026-05-31', label: 'Slot 3 (May 25 – 31, 2026)' },
};



export async function GET(request) {
  try {
    const decoded = await assertAdmin();
    if (!decoded) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const slot = parseInt(searchParams.get('slot') || '1', 10);

    const db = await pool.getConnection();
    try {
      // ── 1. All students in this slot ────────────────────────────────────
      const [students] = await db.execute(
        `SELECT r.username, r.name, r.mode, r.selectedDomain, r.branch, r.batch,
                ps.problem_statement AS problemStatement
         FROM registrations r
         LEFT JOIN problemStatements ps ON r.username = ps.username
         WHERE r.slot = ? AND r.season = '2026'
         ORDER BY r.mode, r.selectedDomain`,
        [slot]
      );

      // ── 2. Daily task submissions for days 2, 3, 4 ─────────────────────
      const usernames = students.map(s => s.username);
      if (!usernames.length) {
        return NextResponse.json({ success: true, data: { students: [], domains: {}, slotInfo: SLOT_DATES[slot] || {}, totalStudents: 0 } });
      }

      const placeholders = usernames.map(() => '?').join(',');
      const [taskRows] = await db.execute(
        `SELECT username, day, data FROM dailyTasks
         WHERE username IN (${placeholders}) AND day IN (2, 3, 4)`,
        usernames
      );

      // ── Helpers ──────────────────────────────────────────────────────────
      const parseData = (raw) => {
        if (!raw) return null;
        if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return null; } }
        return raw;
      };
      const parseAnswers = (raw) => {
        let ans = raw ?? [];
        if (typeof ans === 'string') { try { ans = JSON.parse(ans); } catch { ans = []; } }
        if (Array.isArray(ans)) return ans;
        if (ans && typeof ans === 'object') return Object.keys(ans).sort((a,b)=>Number(a)-Number(b)).map(k=>ans[k]);
        return [];
      };
      const getSurveyMeta = (ps, dayNum) => {
        const idx = dayNum - 2;
        const d = SURVEY[ps];
        if (!d || !d[idx]) return { stakeholder: `Day ${dayNum} Stakeholder`, questions: [] };
        return { stakeholder: d[idx].stakeholder || `Day ${dayNum} Stakeholder`, questions: d[idx].questions || [] };
      };

      // ── 3. Build student lookup ─────────────────────────────────────────
      const studentMap = {};
      students.forEach(s => { studentMap[s.username] = s; });

      // ── 4. Aggregate survey data by domain → PS → day → stakeholder ─────
      // Structure: { domain: { ps: { day2: { stakeholder: {questions,yesCount,noCount,persons} } } } }
      const domainMap = {};

      // Index tasks by username + day
      const taskIndex = {};
      taskRows.forEach(row => {
        const d = parseData(row.data);
        if (!d) return;
        if (!taskIndex[row.username]) taskIndex[row.username] = {};
        taskIndex[row.username][row.day] = d;
      });

      students.forEach(student => {
        const domain = student.selectedDomain || 'Unknown Domain';
        const ps     = student.problemStatement || 'Unknown Problem';
        const mode   = (student.mode || '').toLowerCase();

        if (!domainMap[domain]) domainMap[domain] = {};
        if (!domainMap[domain][ps]) domainMap[domain][ps] = {
          students: [], incampus: 0, invillage: 0, remote: 0,
          day2: {}, day3: {}, day4: {},
        };

        const psEntry = domainMap[domain][ps];
        psEntry.students.push(student.username);
        if (mode.includes('village')) psEntry.invillage++;
        else if (mode.includes('campus')) psEntry.incampus++;
        else psEntry.remote++;

        [2, 3, 4].forEach(dayNum => {
          const taskData = taskIndex[student.username]?.[dayNum];
          if (!taskData || taskData.isFinal === false) return;

          const dayKey = `day${dayNum}`;
          const { stakeholder, questions } = getSurveyMeta(ps, dayNum);
          const shKey = stakeholder;

          if (!psEntry[dayKey][shKey]) {
            psEntry[dayKey][shKey] = { stakeholder: shKey, questions, yesCount: [], noCount: [], totalPersons: 0 };
          }
          const shEntry = psEntry[dayKey][shKey];

          for (let pi = 1; pi <= 30; pi++) {
            const person = taskData[`p${pi}`];
            if (!person) break;
            shEntry.totalPersons++;
            parseAnswers(person.answers).forEach((ans, qi) => {
              shEntry.yesCount[qi] = (shEntry.yesCount[qi] || 0) + (ans === 'Yes' ? 1 : 0);
              shEntry.noCount[qi]  = (shEntry.noCount[qi]  || 0) + (ans === 'No'  ? 1 : 0);
            });
          }
        });
      });

      // ── 5. Summary counts ───────────────────────────────────────────────
      let totalIncampus = 0, totalInvillage = 0, totalRemote = 0;
      students.forEach(s => {
        const m = (s.mode || '').toLowerCase();
        if (m.includes('village')) totalInvillage++;
        else if (m.includes('campus')) totalIncampus++;
        else totalRemote++;
      });

      // Total persons surveyed per category (village vs campus)
      let surveyedIncampus = 0, surveyedInvillage = 0;
      students.forEach(student => {
        const mode = (student.mode || '').toLowerCase();
        [2,3,4].forEach(day => {
          const td = taskIndex[student.username]?.[day];
          if (!td || td.isFinal === false) return;
          for (let pi = 1; pi <= 30; pi++) {
            const p = td[`p${pi}`]; if (!p) break;
            if (mode.includes('village')) surveyedInvillage++;
            else surveyedIncampus++;
          }
        });
      });

      // ── 6. Domain submission stats ──────────────────────────────────────
      const domainStats = {};
      Object.entries(domainMap).forEach(([domain, psMap]) => {
        const sts = Object.values(psMap).reduce((acc, ps) => ({
          students: acc.students + ps.students.length,
          incampus: acc.incampus + ps.incampus,
          invillage: acc.invillage + ps.invillage,
          remote: acc.remote + ps.remote,
        }), { students: 0, incampus: 0, invillage: 0, remote: 0 });
        domainStats[domain] = sts;
      });

      // Serialize
      const domainsOut = {};
      Object.entries(domainMap).forEach(([domain, psMap]) => {
        domainsOut[domain] = {};
        Object.entries(psMap).forEach(([ps, psEntry]) => {
          const days = {};
          ['day2','day3','day4'].forEach(dk => {
            days[dk] = Object.values(psEntry[dk]).map(sh => ({
              stakeholder: sh.stakeholder,
              questions:   sh.questions,
              yesCount:    sh.yesCount,
              noCount:     sh.noCount,
              totalPersons: sh.totalPersons,
            }));
          });
          domainsOut[domain][ps] = {
            studentCount: psEntry.students.length,
            incampus: psEntry.incampus,
            invillage: psEntry.invillage,
            remote: psEntry.remote,
            days,
          };
        });
      });

      return NextResponse.json({
        success: true,
        data: {
          slotInfo: SLOT_DATES[slot] || { label: `Slot ${slot}`, start: '', end: '' },

          totalStudents: students.length,
          totalIncampus,
          totalInvillage,
          totalRemote,
          surveyedIncampus,
          surveyedInvillage,
          domainStats,
          domains: domainsOut,
        },
      });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Slot Report GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
