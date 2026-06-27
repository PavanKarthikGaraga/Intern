import { NextResponse } from 'next/server';
import { defaultPool, legacyPool } from '@/lib/db';

export async function GET() {
  const results = [];
  try {
    try {
      await defaultPool.query(`ALTER TABLE registrations ADD COLUMN season VARCHAR(10) DEFAULT '2026'`);
      results.push('Added season to Social_2026');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') results.push('season already exists in Social_2026');
      else results.push('Error in Social_2026: ' + e.message);
    }
    
    try {
      await legacyPool.query(`ALTER TABLE registrations ADD COLUMN season VARCHAR(10) DEFAULT '2026'`);
      results.push('Added season to Social (legacy)');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') results.push('season already exists in Social (legacy)');
      else results.push('Error in Social (legacy): ' + e.message);
    }
    
    return NextResponse.json({ success: true, results });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
