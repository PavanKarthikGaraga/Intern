import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [users] = await pool.query("SELECT username FROM registrations WHERE selectedDomain = 'Security_Test'");
    const usernames = users.map(u => u.username);
    
    if (usernames.length === 0) {
      return NextResponse.json({ success: true, message: "No test users found to clean." });
    }

    const placeholders = usernames.map(() => '?').join(',');
    
    // Clean up related tables first to avoid orphaned records
    try { await pool.query(`DELETE FROM dailyMarks WHERE username IN (${placeholders})`, usernames); } catch(e) {}
    try { await pool.query(`DELETE FROM reportBooks WHERE username IN (${placeholders})`, usernames); } catch(e) {}
    try { await pool.query(`DELETE FROM marks WHERE username IN (${placeholders})`, usernames); } catch(e) {}
    try { await pool.query(`DELETE FROM studentProfile WHERE username IN (${placeholders})`, usernames); } catch(e) {}
    
    // Finally delete from registrations
    const [delReg] = await pool.query(`DELETE FROM registrations WHERE username IN (${placeholders})`, usernames);
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${delReg.affectedRows} dummy test registrations.` 
    });
  } catch(error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
