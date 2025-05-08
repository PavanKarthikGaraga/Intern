import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(req) {
    try {
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ 
                success: false, 
                error: 'Authentication required. Please login again.' 
            }, { status: 402 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        const { username } = decoded;

        // Get student lead's slot and faculty mentor
        const connection = await pool.getConnection();
        try {
            const [leadData] = await connection.query(
                'SELECT * FROM studentLeads WHERE username = ?',
                [username]
            );

            if (!leadData.length) {
                return NextResponse.json(
                    { success: false, error: 'Student lead not found' },
                    { status: 404 }
                );
            }

            const currentSlot = leadData[0].slot;
            const facultyMentorId = leadData[0].facultyMentorId;

            if (!facultyMentorId) {
                return NextResponse.json(
                    { success: false, error: 'No faculty mentor assigned to this lead' },
                    { status: 400 }
                );
            }

            // Check if there are any students in current slot
            const [currentStudents] = await connection.query(
                'SELECT COUNT(*) as count FROM registrations WHERE studentLeadId = ? AND slot = ?',
                [username, currentSlot]
            );

            const hasStudents = currentStudents[0].count > 0;

            // If in slot 4 and has students, return limit is over
            if (currentSlot === 4 && hasStudents) {
                return NextResponse.json({
                    success: false,
                    error: 'limit is over'
                });
            }

            // Determine target slot based on current slot and student presence
            let targetSlot;
            if (hasStudents) {
                // If current slot has students, move to next slot (1->2->3->4)
                targetSlot = currentSlot < 4 ? currentSlot + 1 : 4;
                // Check reportOpen for the next slot
                const [reportOpenRows] = await connection.query('SELECT slot1, slot2, slot3, slot4 FROM reportOpen WHERE id = 1');
                const reportOpen = reportOpenRows[0];
                if (!reportOpen[`slot${targetSlot}`]) {
                    return NextResponse.json({
                        success: false,
                        error: `Fetching for slot ${targetSlot} is not open yet.`
                    });
                }
                if (targetSlot !== currentSlot) {
                    // Clear all student fields in studentLeads table
                    let clearQuery = 'UPDATE studentLeads SET ';
                    for (let i = 1; i <= 30; i++) {
                        clearQuery += `student${i}Username = NULL`;
                        if (i < 30) clearQuery += ', ';
                    }
                    clearQuery += ', slot = ?, updatedAt = CURRENT_TIMESTAMP WHERE username = ?';
                    await connection.query(clearQuery, [targetSlot, username]);
                }
            } else {
                // If no students in current slot, stay in current slot
                targetSlot = currentSlot;
            }

            // Fetch 30 students from registrations table for the target slot
            const [students] = await connection.query(
                `SELECT r.*, u.day1, u.day2, u.day3, u.day4, u.day5, u.day6, u.day7,
                        v.day1 as verify_day1, v.day2 as verify_day2, v.day3 as verify_day3,
                        v.day4 as verify_day4, v.day5 as verify_day5, v.day6 as verify_day6,
                        v.day7 as verify_day7
                 FROM registrations r
                 LEFT JOIN uploads u ON r.username = u.username
                 LEFT JOIN verify v ON r.username = v.username
                 WHERE r.slot = ? AND r.studentLeadId IS NULL
                 ORDER BY r.createdAt ASC
                 LIMIT 30`,
                [targetSlot]
            );

            // Update studentLeadId and facultyMentorId for fetched students
            if (students.length > 0) {
                const usernames = students.map(student => student.username);
                await connection.query(
                    'UPDATE registrations SET studentLeadId = ?, facultyMentorId = ?, updatedAt = CURRENT_TIMESTAMP WHERE username IN (?)',
                    [username, facultyMentorId, usernames]
                );

                // Update studentLeads table with new students
                let updateFields = {};
                let updateValues = [];
                let updateQuery = 'UPDATE studentLeads SET ';

                // Assign students to slots 1-30
                for (let i = 0; i < students.length; i++) {
                    if (i < 30) {
                        updateFields[`student${i + 1}Username`] = students[i].username;
                    }
                }

                // Build the update query
                const fields = Object.keys(updateFields);
                if (fields.length > 0) {
                    fields.forEach((field, index) => {
                        updateQuery += `${field} = ?`;
                        updateValues.push(updateFields[field]);
                        if (index < fields.length - 1) {
                            updateQuery += ', ';
                        }
                    });
                    updateQuery += ' WHERE username = ?';
                    updateValues.push(username);

                    await connection.query(updateQuery, updateValues);
                }
            }

            return NextResponse.json({
                success: true,
                students,
                slot: targetSlot,
                facultyMentorId,
                slotUpdated: currentSlot !== targetSlot,
                hasStudents
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in fetch students API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
} 