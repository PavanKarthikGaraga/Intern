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

/**
 * GET /api/dashboard/admin/survey-analysis
 * Optional query params: ?slot=1&domain=...&ps=...
 * Returns aggregated survey data grouped by domain → problem statement → stakeholder → question
 */
export async function GET(request) {
  try {
    const decoded = await assertAdmin();
    if (!decoded) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const slotFilter   = searchParams.get('slot')   || 'all';
    const domainFilter = searchParams.get('domain')  || 'all';
    const psFilter     = searchParams.get('ps')      || 'all';

    const db = await pool.getConnection();
    try {
      let whereClause = `r.season = '2026'`;
      const params = [];

      if (slotFilter !== 'all') { whereClause += ` AND r.slot = ?`;                    params.push(slotFilter); }
      if (domainFilter !== 'all') { whereClause += ` AND r.selectedDomain = ?`;         params.push(domainFilter); }
      if (psFilter !== 'all') { whereClause += ` AND ps.problem_statement = ?`;         params.push(psFilter); }

      // Survey submissions for days 2, 3, 4
      const [rows] = await db.execute(
        `SELECT r.username, r.slot, r.selectedDomain AS domain,
                ps.problem_statement AS problemStatement, dt.day, dt.data AS taskData
         FROM registrations r
         JOIN dailyTasks dt ON r.username = dt.username AND dt.day IN (2, 3, 4)
         LEFT JOIN problemStatements ps ON r.username = ps.username
         WHERE ${whereClause}
         ORDER BY r.selectedDomain, ps.problem_statement, r.slot`,
        params
      );

      // Day 5 analysis text submissions
      const [day5Rows] = await db.execute(
        `SELECT r.username, r.selectedDomain AS domain,
                ps.problem_statement AS problemStatement, dt.data AS taskData
         FROM registrations r
         JOIN dailyTasks dt ON r.username = dt.username AND dt.day = 5
         LEFT JOIN problemStatements ps ON r.username = ps.username
         WHERE ${whereClause}
         ORDER BY r.selectedDomain, ps.problem_statement`,
        params
      );

      // Filter options
      const [filterOptions] = await db.execute(
        `SELECT DISTINCT r.slot, r.selectedDomain, ps.problem_statement
         FROM registrations r
         LEFT JOIN problemStatements ps ON r.username = ps.username
         WHERE r.season = '2026'
         ORDER BY r.slot, r.selectedDomain`,
        []
      );

      // ── Helpers ──────────────────────────────────────────────────────────
      const parseAnswers = (raw) => {
        let ans = raw ?? [];
        if (typeof ans === 'string') { try { ans = JSON.parse(ans); } catch { ans = []; } }
        if (Array.isArray(ans)) return ans;
        if (ans && typeof ans === 'object') {
          return Object.keys(ans).sort((a, b) => Number(a) - Number(b)).map(k => ans[k]);
        }
        return [];
      };

      const parseData = (raw) => {
        if (!raw) return null;
        if (typeof raw === 'string') { try { return JSON.parse(raw); } catch { return null; } }
        return raw;
      };

      /**
       * Look up stakeholder name + questions from surveyDataShared.
       * Day 2 → index 0, Day 3 → index 1, Day 4 → index 2
       */
      const getSurveyMeta = (problemStatement, dayNum) => {
        const dayIdx = dayNum - 2; // 0,1,2
        const psData = SURVEY[problemStatement];
        if (!psData || !psData[dayIdx]) return { stakeholder: null, questions: [] };
        return {
          stakeholder: psData[dayIdx].stakeholder || null,
          questions:   psData[dayIdx].questions   || [],
        };
      };

      // ── Build analysis map ───────────────────────────────────────────────
      const analysisMap = {};
      const day5Map     = {};

      // Index Day 5 data by username
      day5Rows.forEach(row => {
        const d = parseData(row.taskData);
        if (!d) return;
        day5Map[row.username] = {
          domain: row.domain,
          problemStatement: row.problemStatement,
          day2_topProblems:    d.day2_topProblems    || '',
          day2_rootCauses:     d.day2_rootCauses     || '',
          day2_recommendations:d.day2_recommendations|| '',
          day3_topProblems:    d.day3_topProblems    || '',
          day3_rootCauses:     d.day3_rootCauses     || '',
          day3_recommendations:d.day3_recommendations|| '',
          day4_topProblems:    d.day4_topProblems    || '',
          day4_rootCauses:     d.day4_rootCauses     || '',
          day4_recommendations:d.day4_recommendations|| '',
        };
      });

      rows.forEach(row => {
        const data = parseData(row.taskData);
        if (!data || data.isFinal === false) return;

        const domain = row.domain         || 'Unknown Domain';
        const ps     = row.problemStatement || 'Unknown Problem Statement';
        const dayNum = row.day;

        if (!analysisMap[domain]) analysisMap[domain] = {};
        if (!analysisMap[domain][ps]) analysisMap[domain][ps] = { day2: {}, day3: {}, day4: {}, students: new Set() };

        const psEntry = analysisMap[domain][ps];
        psEntry.students.add(row.username);

        const dayKey = `day${dayNum}`;

        // Get correct stakeholder name + questions from survey definition
        const { stakeholder: shName, questions: shQuestions } = getSurveyMeta(ps, dayNum);

        // Determine stakeholder key: use official name if found, fallback to day label
        const shKey = shName || `Day ${dayNum} Stakeholder`;

        if (!psEntry[dayKey][shKey]) {
          psEntry[dayKey][shKey] = {
            stakeholder:  shKey,
            officialName: shName,
            questions:    shQuestions,  // from surveyDataShared — actual text
            yesCount:     [],
            noCount:      [],
            totalPersons: 0,
          };
        }

        const shEntry = psEntry[dayKey][shKey];

        // Aggregate answers across all p1..pN persons in this student's submission
        // totalPersons counts actual people interviewed, not number of student submitters
        for (let pIdx = 1; pIdx <= 30; pIdx++) {
          const person = data[`p${pIdx}`];
          if (!person) break;

          shEntry.totalPersons += 1; // ← inside loop: 1 per actual person surveyed

          const answers = parseAnswers(person.answers);
          answers.forEach((ans, qi) => {
            if (!shEntry.yesCount[qi]) shEntry.yesCount[qi] = 0;
            if (!shEntry.noCount[qi])  shEntry.noCount[qi]  = 0;
            if (ans === 'Yes') shEntry.yesCount[qi]++;
            else if (ans === 'No') shEntry.noCount[qi]++;
          });
        }
      });

      // ── Aggregate Day 5 analysis text per domain/PS ──────────────────────
      const day5Analysis = {};
      Object.values(day5Map).forEach(entry => {
        const domain = entry.domain           || 'Unknown Domain';
        const ps     = entry.problemStatement || 'Unknown Problem Statement';
        const key    = `${domain}|||${ps}`;
        if (!day5Analysis[key]) {
          day5Analysis[key] = {
            day2_topProblems: [], day2_rootCauses: [], day2_recommendations: [],
            day3_topProblems: [], day3_rootCauses: [], day3_recommendations: [],
            day4_topProblems: [], day4_rootCauses: [], day4_recommendations: [],
          };
        }
        const a = day5Analysis[key];
        ['day2','day3','day4'].forEach(dk => {
          ['topProblems','rootCauses','recommendations'].forEach(fk => {
            const val = entry[`${dk}_${fk}`];
            if (val && val.trim()) a[`${dk}_${fk}`].push(val.trim());
          });
        });
      });

      // ── Build final result ────────────────────────────────────────────────
      const result = {};
      Object.entries(analysisMap).forEach(([domain, psMap]) => {
        result[domain] = {};
        Object.entries(psMap).forEach(([ps, psEntry]) => {
          const studentCount = psEntry.students.size;
          const days = {};
          ['day2','day3','day4'].forEach(dk => {
            days[dk] = Object.values(psEntry[dk] || {}).map(sh => ({
              stakeholder:  sh.stakeholder,
              totalPersons: sh.totalPersons,
              questions:    sh.questions,
              yesCount:     sh.yesCount,
              noCount:      sh.noCount,
            }));
          });

          const analysisKey = `${domain}|||${ps}`;
          result[domain][ps] = {
            studentCount,
            days,
            analysis: day5Analysis[analysisKey] || null,
          };
        });
      });

      // ── Filter options ────────────────────────────────────────────────────
      const slots   = [...new Set(filterOptions.map(r => r.slot).filter(Boolean))].sort((a,b) => a-b);
      const domains = [...new Set(filterOptions.map(r => r.selectedDomain).filter(Boolean))].sort();
      const psMapObj = {};
      filterOptions.forEach(r => {
        if (r.selectedDomain && r.problem_statement) {
          if (!psMapObj[r.selectedDomain]) psMapObj[r.selectedDomain] = new Set();
          psMapObj[r.selectedDomain].add(r.problem_statement);
        }
      });
      const psByDomain = {};
      Object.entries(psMapObj).forEach(([d, set]) => { psByDomain[d] = [...set].sort(); });

      return NextResponse.json({
        success: true,
        data: result,
        filters: { slots, domains, psByDomain },
        meta: {
          totalDomains: Object.keys(result).length,
          totalPS: Object.values(result).reduce((acc, d) => acc + Object.keys(d).length, 0),
        },
      });
    } finally {
      db.release();
    }
  } catch (err) {
    console.error('Survey Analysis GET error:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
