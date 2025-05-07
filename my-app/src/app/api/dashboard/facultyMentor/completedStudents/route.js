import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function GET(request) {
  let connection;
  try {
    // Get and verify access token
    const cookieStore = await cookies();
    const token = await cookieStore.get("accessToken");
    
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const decoded = await verifyAccessToken(token.value);
    
    if (!decoded || decoded.role !== "facultyMentor") {
      return NextResponse.json(
        { error: "Unauthorized - Invalid token or role" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const slot = searchParams.get('slot');
    const studentLead = searchParams.get('studentLead');

    // Get database connection
    connection = await pool.getConnection();

    // Base query conditions
    const baseConditions = ['r.facultyMentorId = ?'];
    const queryParams = [decoded.username];

    // Add slot filter if provided
    if (slot) {
      baseConditions.push('r.slot = ?');
      queryParams.push(slot);
    }

    // Add student lead filter if provided
    if (studentLead) {
      baseConditions.push('r.studentLeadId = ?');
      queryParams.push(studentLead);
    }

    const conditions = baseConditions.join(' AND ');

    // Get completed students (verified=true, final.completed=true)
    const [completedStudents] = await connection.query(
      `SELECT 
        r.username,
        r.name,
        r.email,
        r.phoneNumber,
        r.branch,
        r.year,
        r.mode,
        r.slot,
        sl.name as studentLeadName,
        sl.username as studentLeadUsername,
        f.finalReport,
        m.grade,
        m.updatedAt as lastEvaluated
      FROM registrations r
      INNER JOIN final f ON r.username = f.username
      LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
      LEFT JOIN marks m ON r.username = m.username
      WHERE ${conditions} AND r.verified = true AND f.completed = true
      ORDER BY m.updatedAt DESC, r.name ASC`,
      queryParams
    );

    // Get verified students (verified=true, final.completed=false)
    const [verifiedStudents] = await connection.query(
      `SELECT 
        r.username,
        r.name,
        r.email,
        r.phoneNumber,
        r.branch,
        r.year,
        r.mode,
        r.slot,
        sl.name as studentLeadName,
        sl.username as studentLeadUsername,
        f.finalReport,
        r.updatedAt as lastUpdated
      FROM registrations r
      INNER JOIN final f ON r.username = f.username
      LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
      WHERE ${conditions} AND r.verified = true AND f.completed = false
      ORDER BY r.updatedAt DESC, r.name ASC`,
      queryParams
    );

    // Get failed students (verified=false or not in final table)
    const [failedStudents] = await connection.query(
      `SELECT 
        r.username,
        r.name,
        r.email,
        r.phoneNumber,
        r.branch,
        r.year,
        r.mode,
        r.slot,
        sl.name as studentLeadName,
        sl.username as studentLeadUsername,
        r.updatedAt as lastUpdated
      FROM registrations r
      LEFT JOIN final f ON r.username = f.username
      LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
      WHERE ${conditions} AND (r.verified = false OR f.username IS NULL)
      ORDER BY r.updatedAt DESC, r.name ASC`,
      queryParams
    );

    // Get available slots and student leads for filters
    const [slots] = await connection.query(
      `SELECT DISTINCT slot FROM registrations WHERE facultyMentorId = ? ORDER BY slot`,
      [decoded.username]
    );

    const [studentLeads] = await connection.query(
      `SELECT DISTINCT sl.username, sl.name 
       FROM studentLeads sl
       JOIN registrations r ON sl.username = r.studentLeadId
       WHERE r.facultyMentorId = ?
       ORDER BY sl.name`,
      [decoded.username]
    );

    return NextResponse.json({ 
      success: true,
      completedStudents,
      verifiedStudents,
      failedStudents,
      filters: {
        slots: slots.map(s => s.slot),
        studentLeads: studentLeads
      }
    });
  } catch (error) {
    console.error("Error in completedStudents GET:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  } finally {
    if (connection) {
      await connection.release();
    }
  }
} 