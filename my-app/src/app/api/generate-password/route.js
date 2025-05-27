import { genPass } from '@/lib/genpass';

export async function GET() {
  const password = genPass();
  return new Response(JSON.stringify({ password }), { status: 200, headers: { 'Content-Type': 'application/json' } });
} 