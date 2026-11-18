/**
 * GET  /api/mygov-tasks  → currently open MyGov quizzes (by end date) and ongoing pledges.
 * POST /api/mygov-tasks  → admin only: re-fetch from MyGov right now.
 */
import { NextResponse } from 'next/server';
import { getSession, requireAdmin } from '@/lib/auth';
import { getMyGovTasks } from '@/lib/mygov';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const user = await getSession();
  if (!user) return NextResponse.json({ success: false, error: 'Please log in.' }, { status: 401 });

  const data = await getMyGovTasks();
  return NextResponse.json(
    { success: true, ...data },
    { headers: { 'Cache-Control': 'private, max-age=300' } }
  );
}

export async function POST() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const data = await getMyGovTasks({ force: true });
  return NextResponse.json({ success: true, ...data });
}
