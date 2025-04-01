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

    // Get total students and completed students
    const [totalResult] = await connection.execute(`
      SELECT 
        COUNT(*) as totalStudents,
        SUM(CASE WHEN a.day8 = 'P' THEN 1 ELSE 0 END) as completedStudents
      FROM registrations r
      LEFT JOIN attendance a ON r.idNumber = a.idNumber
    `);

    // Get students by domain
    const [domainResult] = await connection.execute(`
      SELECT selectedDomain, COUNT(*) as count
      FROM registrations
      GROUP BY selectedDomain
    `);

    // Get students by branch
    const [branchResult] = await connection.execute(`
      SELECT branch, COUNT(*) as count
      FROM registrations
      GROUP BY branch
    `);

    await connection.end();

    // Convert results to required format with default empty objects
    const domainStats = {};
    if (domainResult && domainResult.length > 0) {
      domainResult.forEach(row => {
        domainStats[row.selectedDomain] = row.count;
      });
    }

    const branchStats = {};
    if (branchResult && branchResult.length > 0) {
      branchResult.forEach(row => {
        branchStats[row.branch] = row.count;
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        totalStudents: totalResult[0]?.totalStudents || 0,
        completedStudents: totalResult[0]?.completedStudents || 0,
        domainStats,
        branchStats
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { 
        success: true, 
        data: {
          totalStudents: 0,
          completedStudents: 0,
          domainStats: {},
          branchStats: {}
        }
      }
    );
  }
} 