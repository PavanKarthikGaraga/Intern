import { NextResponse } from 'next/server';

export async function GET() {
  // Returns server epoch in ms — always IST (server is IST or UTC, but epoch is absolute)
  return NextResponse.json({ ts: Date.now() });
}
