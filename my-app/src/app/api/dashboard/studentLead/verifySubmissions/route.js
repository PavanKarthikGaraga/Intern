import { NextResponse } from 'next/server';
import { pool } from '@/config/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(req) {
  try {
    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('accessToken');

    if (!accessToken?.value) {
      return NextResponse.json({ 
        success: false, 
        error: 'Access token is missing. Please login again.' 
      }, { status: 401 });
    }

    let decoded;
    try {
      decoded = await verifyAccessToken(accessToken.value);
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid or expired token. Please login again.' 
      }, { status: 401 });
    }

    if (!decoded) {
      return NextResponse.json({ 
        success: false, 
        error: 'Token verification failed. Please login again.' 
      }, { status: 401 });
    }

    const { username, day, verified, action } = await req.json();

    // Verify that the user is a student lead
    const userQuery = 'SELECT role FROM users WHERE username = ?';
    const [userRows] = await pool.query(userQuery, [decoded.username]);

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found in database' 
      }, { status: 404 });
    }

    const userRole = userRows[0].role;

    if (userRole !== 'studentLead') {
      return NextResponse.json({ 
        success: false, 
        error: `User role is ${userRole}, but studentLead role is required` 
      }, { status: 403 });
    }

    if (action === 'getSubmissions') {
      // Get all submissions for the student
      const submissionsQuery = `
        SELECT 
          day1Link as day1,
          day2Link as day2,
          day3Link as day3,
          day4Link as day4,
          day5Link as day5,
          day6Link as day6,
          day7Link as day7,
          day8Link as day8,
          day9Link as day9,
          day10Link as day10,
          day1Verified as day1Verified,
          day2Verified as day2Verified,
          day3Verified as day3Verified,
          day4Verified as day4Verified,
          day5Verified as day5Verified,
          day6Verified as day6Verified,
          day7Verified as day7Verified,
          day8Verified as day8Verified,
          day9Verified as day9Verified,
          day10Verified as day10Verified
        FROM uploads
        WHERE username = ?
      `;

      const [submissions] = await pool.query(submissionsQuery, [username]);

      // Return empty array if no submissions found
      if (!submissions || submissions.length === 0) {
        return NextResponse.json({ 
          success: true, 
          submissions: [] 
        });
      }

      const submissionData = submissions[0];
      const formattedSubmissions = [];

      for (let day = 1; day <= 10; day++) {
        const link = submissionData[`day${day}`];
        const verified = submissionData[`day${day}Verified`];

        if (link) {
          formattedSubmissions.push({
            day,
            link,
            verified
          });
        }
      }

      return NextResponse.json({
        success: true,
        submissions: formattedSubmissions
      });
    } else if (action === 'verify') {
      // Validate day parameter
      if (!day || day < 1 || day > 10) {
        return NextResponse.json({ 
          success: false, 
          error: 'Invalid day parameter. Day must be between 1 and 10.' 
        }, { status: 400 });
      }

      // Check if the student has any submissions
      const checkSubmissionsQuery = `
        SELECT day${day}Link
        FROM uploads
        WHERE username = ?
      `;

      const [submissionRows] = await pool.query(checkSubmissionsQuery, [username]);

      if (!submissionRows || submissionRows.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'No submissions found for this student' 
        }, { status: 404 });
      }

      const submissionLink = submissionRows[0][`day${day}Link`];
      if (!submissionLink) {
        return NextResponse.json({ 
          success: false, 
          error: `No submission found for day ${day}` 
        }, { status: 404 });
      }

      // Update the verification status
      const updateQuery = `
        UPDATE uploads
        SET day${day}Verified = ?
        WHERE username = ?
      `;

      await pool.query(updateQuery, [verified, username]);

      return NextResponse.json({
        success: true,
        message: 'Submission verification status updated successfully'
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid action specified' 
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Error in verify submission API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 