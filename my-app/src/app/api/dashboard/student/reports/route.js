import pool from "../../../../../lib/db";
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

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
        if (!decoded || decoded.role !== 'student') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only students can submit reports.' 
            }, { status: 403 });
        }

        const { username, day, link, type = 'regular' } = await request.json();

        if (!username || !day || !link) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid request data. Username, day, and link are required.' 
            }, { status: 400 });
        }

        if (username !== decoded.username) {
            return NextResponse.json({ 
                success: false, 
                error: 'You can only submit reports for yourself.' 
            }, { status: 403 });
        }

        if (day < 1 || day > 7) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid day. Day must be between 1 and 7.' 
            }, { status: 400 });
        }

        // Check if this is a resubmission
        const tableName = type === 'current' ? 'suploads' : 'uploads';
        const statusTable = type === 'current' ? 'sstatus' : 'status';
        const attendanceTable = type === 'current' ? 'sattendance' : 'attendance';

        const [existingReport] = await connection.query(
            `SELECT 1 FROM ${tableName} WHERE username = ? AND day${day} IS NOT NULL`,
            [username]
        );

        // Check if record exists in uploads table
        const [uploadCheck] = await connection.query(
            `SELECT 1 FROM ${tableName} WHERE username = ?`,
            [username]
        );

        if (uploadCheck.length === 0) {
            await connection.query(
                `INSERT INTO ${tableName} (username, day${day}) VALUES (?, ?)`,
                [username, link]
            );
        } else {
            await connection.query(
                `UPDATE ${tableName} SET day${day} = ? WHERE username = ?`,
                [link, username]
            );
        }

        // If this is a resubmission, update status to 'new'
        if (existingReport.length > 0) {
            const [statusCheck] = await connection.query(
                `SELECT 1 FROM ${statusTable} WHERE username = ?`,
                [username]
            );

            if (statusCheck.length === 0) {
                await connection.query(
                    `INSERT INTO ${statusTable} (username, day${day}) VALUES (?, ?)`,
                    [username, 'new']
                );
            } else {
                await connection.query(
                    `UPDATE ${statusTable} SET day${day} = ? WHERE username = ?`,
                    ['new', username]
                );
            }
        
            // Update the daily marks for the student
            await connection.query(
                `UPDATE ${attendanceTable} SET day${day} = NULL WHERE username = ?`,
                [username]
            );
        }

        return NextResponse.json({ 
            success: true,
            message: 'Report submitted successfully.'
        });

    } catch (error) {
        console.error('Error in reports POST:', error);
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

// GET Route: Fetch all reports submitted by a student
export async function GET(request) {
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
        if (!decoded || decoded.role !== 'student') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only students can view their reports.' 
            }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');
        const type = searchParams.get('type') || 'regular'; // 'regular' or 'special'

        if (!username) {
            return NextResponse.json({ 
                success: false, 
                error: 'Username is required.' 
            }, { status: 400 });
        }

        if (username !== decoded.username) {
            return NextResponse.json({ 
                success: false, 
                error: 'You can only view your own reports.' 
            }, { status: 403 });
        }

        let reports;
        if (type === 'special') {
            // Fetch reports from sstudent tables
            [reports] = await connection.query(
                `SELECT 
                    u.*,
                    a.day1 as attendance1,
                    a.day2 as attendance2,
                    a.day3 as attendance3,
                    a.day4 as attendance4,
                    a.day5 as attendance5,
                    a.day6 as attendance6,
                    a.day7 as attendance7,
                    s.day1 as status1,
                    s.day2 as status2,
                    s.day3 as status3,
                    s.day4 as status4,
                    s.day5 as status5,
                    s.day6 as status6,
                    s.day7 as status7,
                    m.day1 as marks1,
                    m.day2 as marks2,
                    m.day3 as marks3,
                    m.day4 as marks4,
                    m.day5 as marks5,
                    m.day6 as marks6,
                    m.day7 as marks7,
                    msg.day1 as message1,
                    msg.day2 as message2,
                    msg.day3 as message3,
                    msg.day4 as message4,
                    msg.day5 as message5,
                    msg.day6 as message6,
                    msg.day7 as message7
                FROM suploads u
                LEFT JOIN sattendance a ON u.username = a.username
                LEFT JOIN sstatus s ON u.username = s.username
                LEFT JOIN sdailyMarks m ON u.username = m.username
                LEFT JOIN smessages msg ON u.username = msg.username
                WHERE u.username = ?`,
                [username]
            );

            // Fetch attendance, status, marks, and messages even if no upload exists
            const [attendanceRows] = await connection.query(
                `SELECT day1, day2, day3, day4, day5, day6, day7 FROM sattendance WHERE username = ?`,
                [username]
            );
            const [statusRows] = await connection.query(
                `SELECT day1, day2, day3, day4, day5, day6, day7 FROM sstatus WHERE username = ?`,
                [username]
            );
            const [marksRows] = await connection.query(
                `SELECT day1, day2, day3, day4, day5, day6, day7 FROM sdailyMarks WHERE username = ?`,
                [username]
            );
            const [messagesRows] = await connection.query(
                `SELECT day1, day2, day3, day4, day5, day6, day7 FROM smessages WHERE username = ?`,
                [username]
            );

            const attendance = attendanceRows[0] || {};
            const status = statusRows[0] || {};
            const marks = marksRows[0] || {};
            const messages = messagesRows[0] || {};

            // suploads may not exist for all days, so get uploads if present
            const uploads = reports[0] || {};

            const transformedReports = [];
            for (let i = 1; i <= 7; i++) {
                const dayNumber = i;
                const upload = uploads[`day${i}`] || null;
                const attendanceVal = attendance[`day${i}`] || null;
                const statusVal = status[`day${i}`] || null;
                const marksVal = marks[`day${i}`] || null;
                const messageVal = messages[`day${i}`] || null;

                transformedReports.push({
                    dayNumber,
                    link: upload,
                    attendance: attendanceVal,
                    status: statusVal,
                    marks: marksVal,
                    message: messageVal,
                    verified: attendanceVal === 'P'
                });
            }
            reports = transformedReports;
        } else {
            // Fetch reports from regular tables
            [reports] = await connection.query(
                `SELECT 
                    u.*,
                    v.day1 as verified1,
                    v.day2 as verified2,
                    v.day3 as verified3,
                    v.day4 as verified4,
                    v.day5 as verified5,
                    v.day6 as verified6,
                    v.day7 as verified7,
                    a.day1 as attendance1,
                    a.day2 as attendance2,
                    a.day3 as attendance3,
                    a.day4 as attendance4,
                    a.day5 as attendance5,
                    a.day6 as attendance6,
                    a.day7 as attendance7,
                    s.day1 as status1,
                    s.day2 as status2,
                    s.day3 as status3,
                    s.day4 as status4,
                    s.day5 as status5,
                    s.day6 as status6,
                    s.day7 as status7,
                    m.day1 as marks1,
                    m.day2 as marks2,
                    m.day3 as marks3,
                    m.day4 as marks4,
                    m.day5 as marks5,
                    m.day6 as marks6,
                    m.day7 as marks7,
                    msg.day1 as message1,
                    msg.day2 as message2,
                    msg.day3 as message3,
                    msg.day4 as message4,
                    msg.day5 as message5,
                    msg.day6 as message6,
                    msg.day7 as message7
                FROM uploads u
                LEFT JOIN verify v ON u.username = v.username
                LEFT JOIN attendance a ON u.username = a.username
                LEFT JOIN status s ON u.username = s.username
                LEFT JOIN dailyMarks m ON u.username = m.username
                LEFT JOIN messages msg ON u.username = msg.username
                WHERE u.username = ?`,
                [username]
            );

            // Transform the data into the required format
            const transformedReports = [];
            for (let i = 1; i <= 7; i++) {
                const dayNumber = i;
                const upload = reports[0]?.[`day${i}`];
                const verified = reports[0]?.[`verified${i}`];
                const attendance = reports[0]?.[`attendance${i}`];
                const status = reports[0]?.[`status${i}`];
                const marks = reports[0]?.[`marks${i}`];
                const message = reports[0]?.[`message${i}`];

                if (upload) {
                    transformedReports.push({
                        dayNumber,
                        link: upload,
                        verified,
                        attendance,
                        status,
                        marks,
                        message
                    });
                }
            }
            reports = transformedReports;
        }

        return NextResponse.json({
            success: true,
            data: reports
        });

    } catch (error) {
        console.error('Error in reports GET:', error);
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
