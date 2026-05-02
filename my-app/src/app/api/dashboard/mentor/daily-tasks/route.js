import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

// GET — admin / facultyMentor / studentLead views daily tasks of their assigned students
export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyAccessToken(token);
    const { role, username } = payload;

    if (!['studentLead', 'facultyMentor', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const targetUsername = searchParams.get('username');

    let studentUsernames = [];

    if (role === 'studentLead') {
      const [leadRows] = await pool.query(
        `SELECT student1Username,student2Username,student3Username,student4Username,
                student5Username,student6Username,student7Username,student8Username,
                student9Username,student10Username,student11Username,student12Username,
                student13Username,student14Username,student15Username,student16Username,
                student17Username,student18Username,student19Username,student20Username,
                student21Username,student22Username,student23Username,student24Username,
                student25Username,student26Username,student27Username,student28Username,
                student29Username,student30Username
         FROM studentLeads WHERE username = ?`,
        [username]
      );
      if (!leadRows.length) return NextResponse.json({ data: [] });
      studentUsernames = Object.values(leadRows[0]).filter(Boolean);

    } else if (role === 'facultyMentor') {
      const [students] = await pool.query(
        `SELECT username FROM registrations WHERE facultyMentorId = ?`, [username]
      );
      studentUsernames = students.map(s => s.username);

    } else {
      // admin — all students or specific one
      if (!targetUsername) {
        const [all] = await pool.query(`SELECT username FROM registrations`);
        studentUsernames = all.map(s => s.username);
      }
    }

    // Fetch daily tasks
    let query, params;

    if (targetUsername) {
      // Permission check for non-admins
      if (role !== 'admin' && !studentUsernames.includes(targetUsername)) {
        return NextResponse.json({ error: 'Student not assigned to you' }, { status: 403 });
      }
      query = `
        SELECT dt.username, dt.day, dt.data, dt.submittedAt, dt.updatedAt,
               r.name, r.branch, r.selectedDomain,
               ps.problem_statement
        FROM dailyTasks dt
        JOIN registrations r ON dt.username = r.username
        LEFT JOIN problemStatements ps ON dt.username = ps.username
        WHERE dt.username = ?
        ORDER BY dt.day
      `;
      params = [targetUsername];
    } else {
      if (studentUsernames.length === 0) return NextResponse.json({ data: [] });
      const placeholders = studentUsernames.map(() => '?').join(',');
      query = `
        SELECT dt.username, dt.day, dt.data, dt.submittedAt, dt.updatedAt,
               r.name, r.branch, r.selectedDomain,
               ps.problem_statement
        FROM dailyTasks dt
        JOIN registrations r ON dt.username = r.username
        LEFT JOIN problemStatements ps ON dt.username = ps.username
        WHERE dt.username IN (${placeholders})
        ORDER BY dt.username, dt.day
      `;
      params = studentUsernames;
    }

    const [rows] = await pool.query(query, params);

    // Group by student username → { username, name, branch, domain, ps, days: { 1: data, … } }
    const studentMap = {};
    rows.forEach(row => {
      if (!studentMap[row.username]) {
        studentMap[row.username] = {
          username: row.username,
          name: row.name,
          branch: row.branch,
          domain: row.selectedDomain,
          problem_statement: row.problem_statement,
          days: {},
        };
      }
      studentMap[row.username].days[row.day] = {
        data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data,
        submittedAt: row.submittedAt,
        updatedAt: row.updatedAt,
      };
    });

    return NextResponse.json({ data: Object.values(studentMap) });
  } catch (error) {
    console.error('Error fetching daily tasks:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
