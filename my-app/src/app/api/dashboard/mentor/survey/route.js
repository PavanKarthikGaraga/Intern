import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

// GET — studentLead or facultyMentor fetches survey responses of their assigned students
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

    // Optional: filter by a specific student username via query param
    const { searchParams } = new URL(request.url);
    const targetUsername = searchParams.get('username');

    let query;
    let params;

    if (role === 'studentLead') {
      // Get all students assigned to this lead
      const [leadRows] = await pool.query(
        `SELECT student1Username, student2Username, student3Username, student4Username,
                student5Username, student6Username, student7Username, student8Username,
                student9Username, student10Username, student11Username, student12Username,
                student13Username, student14Username, student15Username, student16Username,
                student17Username, student18Username, student19Username, student20Username,
                student21Username, student22Username, student23Username, student24Username,
                student25Username, student26Username, student27Username, student28Username,
                student29Username, student30Username
         FROM studentLeads WHERE username = ?`,
        [username]
      );

      if (!leadRows.length) return NextResponse.json({ data: [] });

      const lead = leadRows[0];
      const studentUsernames = Object.values(lead).filter(Boolean);

      if (studentUsernames.length === 0) return NextResponse.json({ data: [] });

      if (targetUsername) {
        if (!studentUsernames.includes(targetUsername)) {
          return NextResponse.json({ error: 'Student not assigned to you' }, { status: 403 });
        }
        query = `SELECT sr.*, r.name, r.email, r.branch
                 FROM surveyResponses sr
                 JOIN registrations r ON sr.username = r.username
                 WHERE sr.username = ?`;
        params = [targetUsername];
      } else {
        const placeholders = studentUsernames.map(() => '?').join(',');
        query = `SELECT sr.*, r.name, r.email, r.branch
                 FROM surveyResponses sr
                 JOIN registrations r ON sr.username = r.username
                 WHERE sr.username IN (${placeholders})
                 ORDER BY sr.updatedAt DESC`;
        params = studentUsernames;
      }

    } else if (role === 'facultyMentor') {
      // Get all students assigned to this faculty mentor
      if (targetUsername) {
        // Verify student is under this mentor
        const [check] = await pool.query(
          `SELECT username FROM registrations WHERE username = ? AND facultyMentorId = ?`,
          [targetUsername, username]
        );
        if (!check.length) return NextResponse.json({ error: 'Student not assigned to you' }, { status: 403 });

        query = `SELECT sr.*, r.name, r.email, r.branch
                 FROM surveyResponses sr
                 JOIN registrations r ON sr.username = r.username
                 WHERE sr.username = ?`;
        params = [targetUsername];
      } else {
        query = `SELECT sr.*, r.name, r.email, r.branch
                 FROM surveyResponses sr
                 JOIN registrations r ON sr.username = r.username
                 WHERE r.facultyMentorId = ?
                 ORDER BY sr.updatedAt DESC`;
        params = [username];
      }

    } else {
      // admin — can view any or all
      if (targetUsername) {
        query = `SELECT sr.*, r.name, r.email, r.branch
                 FROM surveyResponses sr
                 JOIN registrations r ON sr.username = r.username
                 WHERE sr.username = ?`;
        params = [targetUsername];
      } else {
        query = `SELECT sr.*, r.name, r.email, r.branch
                 FROM surveyResponses sr
                 JOIN registrations r ON sr.username = r.username
                 ORDER BY sr.updatedAt DESC`;
        params = [];
      }
    }

    const [rows] = await pool.query(query, params);

    const data = rows.map(row => ({
      ...row,
      responses: typeof row.responses === 'string' ? JSON.parse(row.responses) : row.responses,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error fetching survey responses:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
