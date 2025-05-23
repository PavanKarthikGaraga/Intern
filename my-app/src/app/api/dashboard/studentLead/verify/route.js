import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request) {
  const connection = await pool.getConnection();
  try {
    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('accessToken');

    if (!accessToken?.value) {
      return NextResponse.json({ 
        success: false, 
        error: 'Authentication required. Please login again.' 
      }, { status: 401 });
    }

    const decoded = await verifyAccessToken(accessToken.value);
    if (!decoded || decoded.role !== 'studentLead') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only student leads can verify reports.' 
      }, { status: 403 });
    }

    const { username, day, status, marks,message } = await request.json();

    // Validate inputs
    if (!username || !day || typeof status !== 'boolean') {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid request data. Username, day, and status are required.' 
      }, { status: 400 });
    }

    if (day < 1 || day > 7) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid day. Day must be between 1 and 7.' 
      }, { status: 400 });
    }

    // Check if the student belongs to this student lead
    const [studentCheck] = await connection.query(
      `SELECT 1 FROM registrations 
       WHERE username = ? AND studentLeadId = ?`,
      [username, decoded.username]
    );

    if (studentCheck.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Student not found or not assigned to you.' 
      }, { status: 404 });
    }

    // Check if report exists for the day
    const [reportCheck] = await connection.query(
      `SELECT 1 FROM uploads 
       WHERE username = ? AND day${day} IS NOT NULL`,
      [username]
    );

    if (reportCheck.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No report found for this day.' 
      }, { status: 404 });
    }

    await connection.beginTransaction();

    try {
      // Update verification status
      await connection.query(
        `INSERT INTO verify (username, day${day})
         VALUES (?, ?)
         ON DUPLICATE KEY UPDATE day${day} = ?`,
        [username, status, status]
      );

      // If verifying (status=true) and marks are provided, update daily marks
      if (status && typeof marks === 'number') {
        // Check if dailyMarks exists
        const [existingMarks] = await connection.query(
          'SELECT * FROM dailyMarks WHERE username = ?',
          [username]
        );

        if (existingMarks.length > 0) {
          // Update the specific day's marks and recalculate internalMarks
          await connection.query(
            `UPDATE dailyMarks 
             SET day${day} = ?,
                 internalMarks = COALESCE(day1,0)+COALESCE(day2,0)+COALESCE(day3,0)+COALESCE(day4,0)+COALESCE(day5,0)+COALESCE(day6,0)+COALESCE(day7,0)
             WHERE username = ?`,
            [marks, username]
          );
        } else {
          // Insert new marks
          await connection.query(
            `INSERT INTO dailyMarks (username, day${day}, internalMarks)
             VALUES (?, ?, ?)`,
            [username, marks, marks]
          );
        }
      }

      // If rejecting (status=false), mark as absent
      if (!status) {
        await connection.query(
          `INSERT INTO attendance (username, day${day})
           VALUES (?, 'A')
           ON DUPLICATE KEY UPDATE day${day} = 'A'`,
          [username]
        );

        await connection.query(
          `INSERT INTO status (username, day${day})
           VALUES (?, 'A')
           ON DUPLICATE KEY UPDATE day${day} = NULL`,
          [username]
        );
      }

      // Add message if provided
      if (message) {
        // Split message by newlines and commas, filter out empty strings, and join with commas
        const messageList = message
          .split(/[\n,]+/)
          .map(msg => msg.trim())
          .filter(msg => msg.length > 0)
          .join(', ');
        
        const [messagecheck] = await connection.query(
          `SELECT 1 FROM messages WHERE username = ? AND day${day} = ?`,
          [username, day]
        );
        if(messagecheck.length === 0){
          await connection.query(
            `INSERT INTO messages (username, day${day})
           VALUES (?, ?)
           ON DUPLICATE KEY UPDATE day${day} = ?`,
          [username, messageList, messageList]
        );
        }else{
          await connection.query(
            `UPDATE messages SET day${day} = ? WHERE username = ?`,
            [messageList, username]
          );
        }
      }

      await connection.commit();

      return NextResponse.json({
        success: true,
        message: status ? 'Report verified successfully' : 'Report rejected successfully'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    }

  } catch (error) {
    console.error('Error in verify POST:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// GET endpoint to fetch verification status for a student
// export async function GET(request) {
//   const connection = await pool.getConnection();
//   try {
//     const cookieStore = cookies();
//     const accessToken = await cookieStore.get('accessToken');

//     if (!accessToken?.value) {
//       return NextResponse.json({ 
//         success: false, 
//         error: 'Authentication required. Please login again.' 
//       }, { status: 401 });
//     }

//     const decoded = await verifyAccessToken(accessToken.value);
//     if (!decoded || decoded.role !== 'studentLead') {
//       return NextResponse.json({ 
//         success: false, 
//         error: 'Access denied. Only student leads can access verification status.' 
//       }, { status: 403 });
//     }

//     const { searchParams } = new URL(request.url);
//     const username = searchParams.get('username');

//     if (!username) {
//       return NextResponse.json({ 
//         success: false, 
//         error: 'Student username is required.' 
//       }, { status: 400 });
//     }

//     // Check if the student belongs to this student lead
//     const [studentCheck] = await connection.query(
//       `SELECT 1 FROM registrations 
//        WHERE username = ? AND studentLeadId = ?`,
//       [username, decoded.username]
//     );

//     if (studentCheck.length === 0) {
//       return NextResponse.json({ 
//         success: false, 
//         error: 'Student not found or not assigned to you.' 
//       }, { status: 404 });
//     }

//     // Get verification status only
//     const [verificationData] = await connection.query(
//       `SELECT * FROM verify WHERE username = ?`,
//       [username]
//     );

//     return NextResponse.json({
//       success: true,
//       data: verificationData[0] || {
//         day1: false,
//         day2: false,
//         day3: false,
//         day4: false,
//         day5: false,
//         day6: false,
//         day7: false
//       }
//     });

//   } catch (error) {
//     console.error('Error in verify GET:', error);
//     return NextResponse.json(
//       { 
//         success: false,
//         error: 'Internal server error' 
//       },
//       { status: 500 }
//     );
//   } finally {
//     connection.release();
//   }
// } 