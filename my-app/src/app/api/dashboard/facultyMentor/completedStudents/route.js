import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function GET() {
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

    // Get completed students for this faculty mentor
    const [completedStudents] = await pool.query(
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
        f.completed,
        f.finalReport
      FROM registrations r
      INNER JOIN final f ON r.username = f.username
      LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
      WHERE r.facultyMentorId = ? AND f.completed = true
      ORDER BY r.name ASC`,
      [decoded.username]
    );

    return NextResponse.json({ completedStudents });
  } catch (error) {
    console.error("Error in completedStudents GET:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
} 