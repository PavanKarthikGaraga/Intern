import { pool } from '@/config/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { mentorId } = await request.json();

    if (!mentorId) {
      return NextResponse.json({ success: false, error: 'Mentor ID is required' }, { status: 400 });
    }

    // Query to get mentor's info along with assigned student emails and domain
    const [rows] = await pool.query(
      `SELECT 
          u.name AS mentorName, 
          u.username AS mentorId, 
          r.selectedDomain AS domain, 
          r.email AS studentEmail 
       FROM users u
       JOIN studentLeads sl ON u.username = sl.username
       JOIN registrations r ON r.leadId = sl.username
       WHERE u.username = ? AND u.role = 'studentLead'
       LIMIT 1`,
      [mentorId]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Mentor not found' }, { status: 404 });
    }

    const mentor = rows[0];

    return NextResponse.json({
      success: true,
      mentor: {
        name: mentor.mentorName,
        email: mentor.studentEmail,
        domain: mentor.domain
      }
    });

  } catch (error) {
    console.error('Error fetching mentor details:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mentor details' },
      { status: 500 }
    );
  }
}
