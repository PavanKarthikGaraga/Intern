import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import getDBConnection from '@/lib/db';

export async function GET(req) {
  try {
    const token = req.cookies.get('accessToken')?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);
    
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const connection = await getDBConnection();

    // First get all mentors
    const [mentors] = await connection.execute(`
      SELECT 
        sm.mentorId,
        u.name,
        sm.domain,
        COUNT(DISTINCT 
          CASE 
            WHEN sm.student1Id IS NOT NULL THEN sm.student1Id
            WHEN sm.student2Id IS NOT NULL THEN sm.student2Id
            WHEN sm.student3Id IS NOT NULL THEN sm.student3Id
            WHEN sm.student4Id IS NOT NULL THEN sm.student4Id
            WHEN sm.student5Id IS NOT NULL THEN sm.student5Id
            WHEN sm.student6Id IS NOT NULL THEN sm.student6Id
            WHEN sm.student7Id IS NOT NULL THEN sm.student7Id
            WHEN sm.student8Id IS NOT NULL THEN sm.student8Id
            WHEN sm.student9Id IS NOT NULL THEN sm.student9Id
            WHEN sm.student10Id IS NOT NULL THEN sm.student10Id
          END
        ) as studentsAssigned
      FROM studentMentors sm
      JOIN users u ON sm.mentorId = u.idNumber
      GROUP BY sm.mentorId, u.name, sm.domain
      ORDER BY u.name ASC
    `);

    // For each mentor, get their assigned students with details
    const mentorsWithStudents = await Promise.all(mentors.map(async (mentor) => {
      const [students] = await connection.execute(`
        SELECT 
          r.idNumber,
          r.name,
          CASE 
            WHEN a.day8 = 'P' THEN 'Completed'
            WHEN a.day1 = 'P' THEN 'Active'
            ELSE 'Pending'
          END as status
        FROM studentMentors sm
        JOIN registrations r ON 
          r.idNumber IN (
            sm.student1Id, sm.student2Id, sm.student3Id,
            sm.student4Id, sm.student5Id, sm.student6Id,
            sm.student7Id, sm.student8Id, sm.student9Id,
            sm.student10Id
          )
        LEFT JOIN attendance a ON r.idNumber = a.idNumber
        WHERE sm.mentorId = ?
        ORDER BY r.name ASC
      `, [mentor.mentorId]);

      return {
        ...mentor,
        assignedStudents: students
      };
    }));

    await connection.end();

    return NextResponse.json({
      success: true,
      mentors: mentorsWithStudents
    });
  } catch (error) {
    console.error('Error fetching mentors:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch mentors' },
      { status: 500 }
    );
  }
} 