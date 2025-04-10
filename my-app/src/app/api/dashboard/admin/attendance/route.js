import { NextResponse } from 'next/server';
import getDBConnection from '@/lib/db';

export async function GET(request) {
    let db;
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
        }

        db = await getDBConnection();
        const [rows] = await db.execute(`
            SELECT day1, day2, day3, day4, day5, day6, day7, day8
            FROM attendance
            WHERE idNumber = ?
        `, [studentId]);

        // Transform the data into a more usable format
        const formattedAttendance = rows[0] ? {
            day1: rows[0].day1,
            day2: rows[0].day2,
            day3: rows[0].day3,
            day4: rows[0].day4,
            day5: rows[0].day5,
            day6: rows[0].day6,
            day7: rows[0].day7,
            day8: rows[0].day8
        } : {};

        return NextResponse.json({
            success: true,
            data: formattedAttendance
        });

    } catch (error) {
        console.error('Error fetching attendance:', error);
        return NextResponse.json(
            { error: 'Failed to fetch attendance' },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
}

export async function POST(request) {
    let db;
    try {
        const { studentId, dayNumber, status } = await request.json();

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
