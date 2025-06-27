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
        // console.log(rows[0]);
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

export async function POST(req) {
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

        const { finalReport, finalPresentation, isUpdate } = await req.json();

        // Validate input
        if (!finalReport || !finalPresentation) {
            return NextResponse.json({ 
                success: false, 
                error: 'Both final report and presentation links are required' 
            }, { status: 400 });
        }

        // Check if submission is open for the student's slot
        const [slotResult] = await pool.query(
            'SELECT slot FROM registrations WHERE username = ?',
            [decoded.username]
        );

        if (!slotResult.length) {
            return NextResponse.json({ 
                success: false, 
                error: 'Student registration not found' 
            }, { status: 404 });
        }

        const [reportOpenResult] = await pool.query(
            'SELECT slot1, slot2, slot3, slot4 FROM reportOpen WHERE id = 1'
        );

        if (!reportOpenResult.length) {
            return NextResponse.json({ 
                success: false, 
                error: 'Report submission status not found' 
            }, { status: 404 });
        }

        const slot = slotResult[0].slot;
        const isOpen = reportOpenResult[0][`slot${slot}`];

        if (!isOpen) {
            return NextResponse.json({ 
                success: false, 
                error: 'Final report submission is not currently open for your slot.' 
            }, { status: 403 });
        }

        // Check if report already exists
        const [existingReport] = await pool.query(
            'SELECT * FROM final WHERE username = ?',
            [decoded.username]
        );

        if (existingReport.length > 0) {
            if (!isUpdate) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'A final report already exists. Please use the edit option to update it.' 
                }, { status: 400 });
            }

            // Update existing report
            await pool.query(
                `UPDATE final 
                SET finalReport = ?, 
                    finalPresentation = ?,
                    completed = FALSE
                WHERE username = ?`,
                [finalReport, finalPresentation, decoded.username]
            );
        } else {
            if (isUpdate) {
                return NextResponse.json({ 
                    success: false, 
                    error: 'No existing report found to update' 
                }, { status: 404 });
            }

            // Insert new report
            await pool.query(
                `INSERT INTO final 
                (username, facultyMentorId, finalReport, finalPresentation, completed) 
                SELECT ?, facultyMentorId, ?, ?, FALSE
                FROM registrations 
                WHERE username = ?`,
                [decoded.username, finalReport, finalPresentation, decoded.username]
            );
        }

        return NextResponse.json({ 
            success: true, 
            message: isUpdate ? 'Final report updated successfully' : 'Final report submitted successfully'
        });

    } catch (error) {
        console.error('Error handling final report:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to process final report submission' 
        }, { status: 500 });
    }
} 