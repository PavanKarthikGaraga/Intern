import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

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
        if (!decoded || decoded.role !== 'studentLead') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only student leads can evaluate.' 
            }, { status: 403 });
        }

        const body = await request.json();
        const { 
            username, 
            finalReport = 0, 
            finalPresentation = 0, 
            feedback = '', 
            totalMarks = 0, 
            grade = 'Not Qualified', 
            internalMarks = 0 
        } = body;

        if (!username) {
            return NextResponse.json({ success: false, error: 'Username is required.' }, { status: 400 });
        }

        let db;
        try {
            db = await pool.getConnection();

            // Get internalMarks from dailyMarks if not provided
            let actualInternalMarks = internalMarks;
            if (!actualInternalMarks) {
                const [marksRows] = await db.query('SELECT internalMarks FROM dailyMarks WHERE username = ?', [username]);
                actualInternalMarks = marksRows[0]?.internalMarks || 0;
            }

            // Check if marks already exist
            const [existing] = await db.query('SELECT id FROM marks WHERE username = ?', [username]);
            if (existing.length > 0) {
                // Update
                await db.query(
                    `UPDATE marks SET 
                        finalReport = ?, 
                        finalPresentation = ?, 
                        feedback = ?, 
                        totalMarks = ?, 
                        grade = ?, 
                        internalMarks = ?
                    WHERE username = ?`,
                    [finalReport, finalPresentation, feedback, totalMarks, grade, actualInternalMarks, username]
                );
            } else {
                // Insert
                // Get studentLead's facultyMentorId
                const [regRows] = await db.query('SELECT facultyMentorId FROM registrations WHERE username = ?', [username]);
                const facultyMentorId = regRows[0]?.facultyMentorId || null;
                await db.query(
                    `INSERT INTO marks (username, facultyMentorId, internalMarks, finalReport, finalPresentation, totalMarks, grade, feedback)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                    [username, facultyMentorId, actualInternalMarks, finalReport, finalPresentation, totalMarks, grade, feedback]
                );   
            }

            await db.query(
                `UPDATE final SET completed = 1 WHERE username = ?`,
                [username]
            );

            return NextResponse.json({ success: true, message: 'Evaluation submitted successfully.' });
        } catch (err) {
            console.error('Error evaluating report:', err);
            return NextResponse.json({ success: false, error: err.message }, { status: 500 });
        } finally {
            if (db) await db.release();
        }
    } catch (err) {
        console.error('Error in POST route', err);
        return NextResponse.json({ 
            success: false, 
            error: 'An error occurred. Please try again later.' 
        }, { status: 500 });
    }
} 