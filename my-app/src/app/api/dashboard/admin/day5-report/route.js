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

export async function GET(request) {
  try {
    const decoded = await assertAdmin();
    if (!decoded) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const slotFilter = searchParams.get('slot');
    const modesFilter = searchParams.get('modes'); // e.g., "In-Village,In-Campus"

    if (!slotFilter) {
      return NextResponse.json({ success: false, error: 'Slot is required' }, { status: 400 });
    }

    const modes = modesFilter ? modesFilter.split(',') : [];
    
    const db = await pool.getConnection();
    try {
      let whereClause = `r.season = '2026' AND r.slot = ?`;
      const params = [slotFilter];

      if (modes.length > 0) {
        whereClause += ` AND r.mode IN (${modes.map(() => '?').join(',')})`;
        params.push(...modes);
      }

      // Fetch all students matching slot and modes
      const [students] = await db.execute(
        `SELECT r.username, r.name, r.slot, r.mode, ps.problem_statement AS problemStatement
         FROM registrations r
         LEFT JOIN problemStatements ps ON r.username = ps.username
         WHERE ${whereClause}
         ORDER BY r.name ASC`,
        params
      );

      if (students.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      const usernames = students.map(s => s.username);
      
      // We must chunk usernames if there are too many (MySQL IN clause limit)
      // For simplicity, we assume < 1000 students per slot/mode.
      const usernamePlaceholders = usernames.map(() => '?').join(',');

      // Fetch Day 2, 3, 4, 5 data for these students
      const [tasks] = await db.execute(
        `SELECT username, day, data
         FROM dailyTasks
         WHERE username IN (${usernamePlaceholders}) AND day IN (2, 3, 4, 5)`,
        [...usernames]
      );

      // Map tasks by username -> day -> data
      const tasksMap = {};
      tasks.forEach(task => {
        if (!tasksMap[task.username]) tasksMap[task.username] = {};
        try {
          tasksMap[task.username][task.day] = typeof task.data === 'string' ? JSON.parse(task.data) : task.data;
        } catch (e) {
          tasksMap[task.username][task.day] = {};
        }
      });

      const parseAnswers = (raw) => {
        let ans = raw ?? [];
        if (typeof ans === 'string') { try { ans = JSON.parse(ans); } catch { ans = []; } }
        if (Array.isArray(ans)) return ans;
        if (ans && typeof ans === 'object') {
          return Object.keys(ans).sort((a, b) => Number(a) - Number(b)).map(k => ans[k]);
        }
        return [];
      };

      const getSurveyMeta = (problemStatement, dayNum) => {
        const dayIdx = dayNum - 2; // 0,1,2
        const psData = SURVEY[problemStatement];
        if (!psData || !psData[dayIdx]) return { stakeholder: null, questions: [] };
        return {
          stakeholder: psData[dayIdx].stakeholder || null,
          questions:   psData[dayIdx].questions   || [],
        };
      };

      const result = students.map(student => {
        const studentTasks = tasksMap[student.username] || {};
        const day5Data = studentTasks[5] || {};

        // Extract Day 5 text
        const isSlot4OrMore = Number(String(student.slot).replace(/\\D/g, '')) >= 4;
        let analysisText = {};
        if (isSlot4OrMore) {
          analysisText = {
            isSlot4OrMore: true,
            actualProblem: day5Data.day5_actualProblem || '',
            whoAffected: day5Data.day5_whoAffected || '',
            surveyInsight: day5Data.day5_surveyInsight || '',
            mainReason: day5Data.day5_mainReason || '',
            impact: day5Data.day5_impact || '',
            finalStatement: day5Data.day5_finalStatement || '',
          };
        } else {
          analysisText = {
            isSlot4OrMore: false,
            day2: {
              topProblems: day5Data.day2_topProblems || '',
              rootCauses: day5Data.day2_rootCauses || '',
              recommendations: day5Data.day2_recommendations || '',
            },
            day3: {
              topProblems: day5Data.day3_topProblems || '',
              rootCauses: day5Data.day3_rootCauses || '',
              recommendations: day5Data.day3_recommendations || '',
            },
            day4: {
              topProblems: day5Data.day4_topProblems || '',
              rootCauses: day5Data.day4_rootCauses || '',
              recommendations: day5Data.day4_recommendations || '',
            }
          };
        }

        // Extract Day 2, 3, 4 survey %
        const surveyData = {};
        [2, 3, 4].forEach(dayNum => {
          const dayData = studentTasks[dayNum];
          if (!dayData) return;

          const { stakeholder, questions } = getSurveyMeta(student.problemStatement, dayNum);
          if (!questions.length) return;

          const yesCount = new Array(questions.length).fill(0);
          const noCount = new Array(questions.length).fill(0);
          let totalPersons = 0;

          for (let pIdx = 1; pIdx <= 30; pIdx++) {
            const person = dayData[`p${pIdx}`];
            if (!person) break;
            totalPersons++;
            const answers = parseAnswers(person.answers);
            answers.forEach((ans, qi) => {
              if (ans === 'Yes') yesCount[qi]++;
              else if (ans === 'No') noCount[qi]++;
            });
          }

          if (totalPersons > 0) {
            surveyData[`day${dayNum}`] = {
              stakeholder: stakeholder || `Stakeholder Day ${dayNum}`,
              totalPersons,
              questions: questions.map((q, idx) => {
                const yes = yesCount[idx];
                const no = noCount[idx];
                const total = yes + no;
                const percentage = total > 0 ? Math.round((yes / total) * 100) : 0;
                return { question: q, percentage };
              })
            };
          }
        });

        return {
          username: student.username,
          name: student.name,
          slot: student.slot,
          mode: student.mode,
          problemStatement: student.problemStatement,
          analysisText,
          surveyData
        };
      });

      return NextResponse.json({ success: true, data: result });
    } finally {
      db.release();
    }
  } catch (error) {
    console.error('Day 5 Report GET error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
