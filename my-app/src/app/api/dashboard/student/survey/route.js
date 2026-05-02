import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

// POST — student submits survey responses
export async function POST(request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (payload.role !== 'student') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { responses, problem_statement, domain } = await request.json();
    if (!responses || !problem_statement || !domain) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO surveyResponses (username, problem_statement, domain, responses)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         responses = VALUES(responses),
         problem_statement = VALUES(problem_statement),
         domain = VALUES(domain),
         updatedAt = CURRENT_TIMESTAMP`,
      [payload.username, problem_statement, domain, JSON.stringify(responses)]
    );

    return NextResponse.json({ success: true, message: 'Survey submitted successfully' });
  } catch (error) {
    console.error('Error submitting survey:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET — student fetches their own responses
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const payload = await verifyAccessToken(token);
    if (payload.role !== 'student') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const [rows] = await pool.query(
      `SELECT username, problem_statement, domain, responses, submittedAt, updatedAt
       FROM surveyResponses WHERE username = ?`,
      [payload.username]
    );

    if (rows.length === 0) return NextResponse.json({ data: null });

    const row = rows[0];
    return NextResponse.json({
      data: {
        ...row,
        responses: typeof row.responses === 'string' ? JSON.parse(row.responses) : row.responses,
      }
    });
  } catch (error) {
    console.error('Error fetching survey:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
