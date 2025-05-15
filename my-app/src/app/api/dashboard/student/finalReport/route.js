import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

// Helper function to check if report submission is allowed for a slot
async function isReportSubmissionAllowed(slot) {
    try {
        const [rows] = await pool.query(
            "SELECT slot1, slot2, slot3, slot4 FROM reportOpen WHERE id = 1"
        );
        
        if (rows.length === 0) {
            return false;
        }
        console.log(rows[0]);
        const reportStatus = rows[0];
        return reportStatus[`slot${slot}`] === 1;
    } catch (error) {
        console.error("Error checking report submission status:", error);
        return false;
    }
}

export async function GET(request) {
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
                error: 'Access denied. Only students can view final report status.' 
            }, { status: 403 });
        }

        const db = await pool.getConnection();
        try {
            // First check if student exists in registrations
            const [registration] = await db.query(
                `SELECT slot FROM registrations WHERE username = ?`,
                [decoded.username]
            );

            if (!registration || registration.length === 0) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Student registration not found.' 
                }, { status: 404 });
            }

            const isAllowed = await isReportSubmissionAllowed(registration[0].slot);
           
            // Then check final table
            const [final] = await db.query(
                `SELECT finalReport, finalPresentation, completed FROM final WHERE username = ?`,
                [decoded.username]
            );

            return NextResponse.json({ 
                success: true,
                data: {
                    finalReport: final[0]?.finalReport || null,
                    finalPresentation: final[0]?.finalPresentation || null,
                    completed: final[0]?.completed === 1 || false,
                    submissionOpen: isAllowed
                }
            });
        } finally {
            db.release();
        }
    } catch (error) {
        console.error('Error fetching final report status:', error);
        return NextResponse.json(
            { 
                success: false,
                error: 'Internal server error' 
            },
            { status: 500 }
        );
    }
}

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
                error: 'Access denied. Only students can submit final reports.' 
            }, { status: 403 });
        }

        const body = await request.json();
        const { finalReport, finalPresentation } = body;

        if (!finalReport || !finalPresentation) {
            return NextResponse.json({ 
                success: false, 
                error: 'Both final report and presentation are required.' 
            }, { status: 400 });
        }

        const db = await pool.getConnection();
        try {
            // First check if student exists in registrations and is verified
            const [registration] = await db.query(
                `SELECT facultyMentorId, slot FROM registrations WHERE username = ?`,
                [decoded.username]
            );

            if (!registration || registration.length === 0) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'Student registration not found.' 
                }, { status: 404 });
            }

            // if (registration[0].verified !== 1) {
            //     return NextResponse.json({ 
            //         success: false, 
            //         error: 'Student not verified.' 
            //     }, { status: 403 });
            // }

            // Check if report submission is allowed for this slot
            const isAllowed = await isReportSubmissionAllowed(registration[0].slot);
            if (!isAllowed) {
              console.log(isAllowed);
                return NextResponse.json({ 
                    success: false, 
                    error: 'Final report submission is not currently open for your slot.' 
                }, { status: 403 });
            }

            // Check if record exists in final table
            const [existing] = await db.query(
                `SELECT username FROM final WHERE username = ?`,
                [decoded.username]
            );

            if (!existing || existing.length === 0) {
                // Insert new record
                await db.query(
                    `INSERT INTO final (username, facultyMentorId, finalReport, finalPresentation)
                     VALUES (?, ?, ?, ?)`,
                    [decoded.username, registration[0].facultyMentorId, finalReport, finalPresentation]
                );
            } else {
                // Update existing record
                await db.query(
                    `UPDATE final SET finalReport = ?, finalPresentation = ? WHERE username = ?`,
                    [finalReport, finalPresentation, decoded.username]
                );
            }   

            return NextResponse.json({ 
                success: true,
                message: 'Final report submitted successfully.'
            });
        } finally {
            db.release();
        }
    } catch (error) {
        console.error('Error submitting final report:', error);
        return NextResponse.json(
            { 
                success: false,
                error: 'Internal server error' 
            },
            { status: 500 }
        );
    }
} 