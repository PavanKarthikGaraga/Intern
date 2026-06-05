import { NextResponse } from 'next/server';
import { defaultPool } from '@/lib/db';

export async function GET() {
  try {
    const [rows] = await defaultPool.query('SELECT * FROM registrations WHERE username = "2500031502"');
    const [ps] = await defaultPool.query('SELECT * FROM problemStatements WHERE username = "2500031502"');
    return NextResponse.json({ rows, ps });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
