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

    // Fetch students with their registration details and reports
    const [rows] = await connection.execute(`
      SELECT 
        r.idNumber,
        r.name,
        r.email,
        r.branch,
        r.year,
        r.selectedDomain as domain,
        r.phoneNumber as phone,
        r.studentMentorId,
        m.name as mentorName,
        CASE 
          WHEN a.day8 = 'P' THEN 'Completed'
          WHEN a.day1 = 'P' THEN 'Active'
          ELSE 'Pending'
        END as status,
        u.day1Link, u.day2Link, u.day3Link, u.day4Link, 
        u.day5Link, u.day6Link, u.day7Link, u.day8Link
      FROM registrations r
      LEFT JOIN users m ON r.studentMentorId = m.idNumber
      LEFT JOIN attendance a ON r.idNumber = a.idNumber
      LEFT JOIN uploads u ON r.idNumber = u.idNumber
      ORDER BY r.createdAt DESC
    `);

    // Format the reports data
    const formattedRows = rows.map(row => {
      const reports = [];
      for (let i = 1; i <= 8; i++) {
        const link = row[`day${i}Link`];
        reports.push(link || null);
        delete row[`day${i}Link`];
      }
      return {
        ...row,
        reports
      };
    });

    await connection.end();

    return NextResponse.json({
      success: true,
      students: formattedRows
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch students' },
      { status: 500 }
    );
  }
} 