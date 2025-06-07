import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

export async function POST(request) {
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
                error: 'Access denied. Only students can access this data.' 
            }, { status: 403 });
        }

        const { username, previousSlot, previousSlotMarks, mode, newSlot } = await request.json();

        // Validate input
        if (!username || !previousSlot || !previousSlotMarks || !mode || !newSlot) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate newSlot
        if (newSlot !== 5 && newSlot !== 6) {
            return NextResponse.json(
                { success: false, error: 'Invalid slot number' },
                { status: 400 }
            );
        }

        let db;
        try {
            db = await pool.getConnection();

            // Check if slot registration is open
            const reportOpenQuery = `
                SELECT slot5, slot6
                FROM reportOpen
                WHERE id = 1;
            `;
            const [reportOpenRows] = await db.execute(reportOpenQuery);
            const reportOpen = reportOpenRows[0];

            if (!reportOpen || !reportOpen[`slot${newSlot}`]) {
                return NextResponse.json(
                    { success: false, error: `Slot ${newSlot} registration is not open` },
                    { status: 400 }
                );
            }

            // Check if student is already registered
            const existingStudentQuery = `
                SELECT * FROM sstudents 
                WHERE username = ? AND slot = ?;
            `;
            const [existingStudent] = await db.execute(existingStudentQuery, [username, newSlot]);

            if (existingStudent.length > 0) {
                return NextResponse.json(
                    { success: false, error: `Already registered for Slot ${newSlot}` },
                    { status: 400 }
                );
            }

            // Validate eligibility
            const isEligible = (newSlot === 5 && (previousSlot === 1 || previousSlot === 2)) ||
                             (newSlot === 6 && (previousSlot === 2 || previousSlot === 3 || previousSlot === 4));

            if (!isEligible) {
                return NextResponse.json(
                    { success: false, error: `Not eligible for Slot ${newSlot}` },
                    { status: 400 }
                );
            }

            // Start transaction
            await db.beginTransaction();

            try {
                // Insert into sstudents table
                await db.execute(`
                    INSERT INTO sstudents (username, mode, slot, previousSlot, previousSlotMarks)
                    VALUES (?, ?, ?, ?, ?)
                `, [username, mode, newSlot, previousSlot, previousSlotMarks]);

                // Create entries in all s-tables
                const tables = [
                    'suploads',
                    'sstatus',
                    'sattendance',
                    'smessages',
                    'sdailyMarks',
                ];

                for (const table of tables) {
                    const query = `
                        INSERT INTO ${table} (username)
                        VALUES (?)
                    `;
                    await db.execute(query, [username]);
                }

                // Update stats table
                const modeColumn = mode.toLowerCase() === 'remote' ? 'Remote' : 'Incamp';
                const statsUpdateQuery = `
                    UPDATE stats 
                    SET slot${newSlot} = slot${newSlot} + 1,
                        slot${newSlot}${modeColumn} = slot${newSlot}${modeColumn} + 1,
                        ${mode.toLowerCase()} = ${mode.toLowerCase()} + 1,
                        totalStudents = totalStudents + 1
                    WHERE id = 1;
                `;
                await db.execute(statsUpdateQuery);

                await db.commit();

                return NextResponse.json({
                    success: true,
                    message: `Successfully registered for Slot ${newSlot}`
                });

            } catch (error) {
                await db.rollback();
                throw error;
            }

        } catch (error) {
            console.error('Slot registration error:', error);
            return NextResponse.json(
                { success: false, error: error.message || 'Registration failed' },
                { status: 500 }
            );
        } finally {
            if (db) await db.release();
        }

    } catch (error) {
        console.error('Slot registration error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal server error' },
            { status: 500 }
        );
    }
} 