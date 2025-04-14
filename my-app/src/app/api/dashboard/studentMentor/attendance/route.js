import getDBConnection from "@/lib/db";
import { sendEmail } from '@/lib/email';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

// GET method to fetch attendance
export async function GET(request) {
    let db;
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return new Response(
                JSON.stringify({ success: false, error: "Student ID is required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        db = await getDBConnection();
        const [attendance] = await db.execute(
            "SELECT day1, day2, day3, day4, day5, day6, day7, day8 FROM attendance WHERE idNumber = ?",
            [studentId]
        );

        return new Response(
            JSON.stringify({ success: true, data: attendance[0] || {} }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error fetching attendance:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
}

// POST method to mark attendance
export async function POST(request) {
    let db;
    try {
        // Check authentication
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        if (!decoded || (decoded.role !== 'student' && decoded.role !== 'studentMentor')) {
            return NextResponse.json({ error: 'Only students and mentors can access this resource' }, { status: 403 });
        }

        const { studentId, dayNumber, status, documentUrl } = await request.json();

        if (!studentId || !dayNumber || !status) {
            return NextResponse.json(
                { error: 'Student ID, day number, and status are required' },
                { status: 400 }
            );
        }

        // Validate status
        if (!['P', 'A'].includes(status)) {
            return NextResponse.json(
                { error: 'Invalid status. Must be P or A' },
                { status: 400 }
            );
        }

        db = await getDBConnection();

        // Check if previous day's attendance is marked (except for day 1)
        if (dayNumber > 1) {
            const [prevDayResult] = await db.execute(`
                SELECT day${dayNumber - 1} as prevDay
                FROM attendance
                WHERE idNumber = ?
            `, [studentId]);
            
            if (!prevDayResult[0] || !prevDayResult[0].prevDay) {
                return NextResponse.json(
                    { error: 'Previous day\'s attendance must be marked first' },
                    { status: 400 }
                );
            }
        }

        // First, check if an attendance record exists
        const [existingRecord] = await db.execute(`
            SELECT idNumber FROM attendance WHERE idNumber = ?
        `, [studentId]);

        if (existingRecord.length === 0) {
            // Create new record
            await db.execute(`
                INSERT INTO attendance (idNumber, day${dayNumber})
                VALUES (?, ?)
            `, [studentId, status]);
        } else {
            // Update existing record
            await db.execute(`
                UPDATE attendance
                SET day${dayNumber} = ?
                WHERE idNumber = ?
            `, [status, studentId]);
        }

        // Get student details for email notification
        const [studentDetails] = await db.execute(`
            SELECT name, email FROM registrations WHERE idNumber = ?
        `, [studentId]);

        if (studentDetails.length > 0) {
            const student = studentDetails[0];
            // Send email notification
            await sendEmail(student.email, 'attendanceMarked', {
                name: student.name,
                idNumber: studentId,
                day: dayNumber,
                status: status === 'P' ? 'Present' : 'Absent',
                documentUrl: documentUrl || null
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Attendance marked successfully'
        });

    } catch (error) {
        console.error('Error marking attendance:', error);
        return NextResponse.json(
            { error: 'Failed to mark attendance' },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
} 