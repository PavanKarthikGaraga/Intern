import { NextResponse } from 'next/server';
import { defaultPool } from '@/lib/db';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    
    let conditions = [];
    let params = [];
    
    if (search) {
      conditions.push('(r.username LIKE ? OR r.name LIKE ? OR r.email LIKE ? OR r.selectedDomain LIKE ? OR ps.problem_statement LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const studentsQuery = `
      SELECT 
        r.username,
        MAX(r.name) as name,
        MAX(ps.problem_statement) as problem_statement
      FROM registrations r
      LEFT JOIN problemStatements ps ON r.username = ps.username
      ${whereClause}
      GROUP BY r.username
    `;

    const [students] = await defaultPool.query(studentsQuery, params);

    return NextResponse.json({ success: true, count: students.length, students });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
