import { NextResponse } from 'next/server';
// import mysql from 'mysql2/promise';
import getDBConnection from '@/lib/db';

export async function POST(request) {
  try {
    const { mentorId } = await request.json();

    if (!mentorId) {
      return NextResponse.json({ success: false, error: 'Mentor ID is required' }, { status: 400 });
    }

    // Create MySQL connection
    const connection = await getDBConnection();

    // Join users and studentMentors tables to get all required information
    const [rows] = await connection.execute(
      `SELECT u.name, u.idNumber as mentorId, sm.domain, r.email 
       FROM users u 
       JOIN studentMentors sm ON u.idNumber = sm.mentorId 
       JOIN registrations r ON u.idNumber = r.studentMentorId
       WHERE u.idNumber = ? AND u.role = 'studentMentor'
       LIMIT 1`,
      [mentorId]
    );

    await connection.end();

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Mentor not found' }, { status: 404 });
    }

    const mentor = rows[0];

    return NextResponse.json({
      success: true,
      mentor: {
        name: mentor.name,
        email: mentor.email,
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