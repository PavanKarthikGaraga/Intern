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

        // Verify faculty mentor role
        if (decoded.role !== 'facultyMentor') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized access' },
                { status: 403 }
            );
        }

        const connection = await pool.getConnection();
        try {
            // Get current faculty mentor data
            const [mentorData] = await connection.query(
                'SELECT * FROM facultyMentors WHERE username = ?',
                [username]
            );

            if (!mentorData.length) {
                return NextResponse.json(
                    { success: false, error: 'Faculty mentor not found' },
                    { status: 404 }
                );
            }

            const mentor = mentorData[0];

            // Check if mentor already has 2 leads
            if (mentor.lead1Id && mentor.lead2Id) {
                return NextResponse.json(
                    { success: false, error: 'You already have 2 student leads assigned' },
                    { status: 400 }
                );
            }

            // Fetch available student leads (those not assigned to any faculty mentor)
            const [availableLeads] = await connection.query(
                `SELECT * FROM studentLeads 
                 WHERE facultyMentorId IS NULL 
                 ORDER BY createdAt ASC 
                 LIMIT 2`,
                []
            );

            if (availableLeads.length === 0) {
                return NextResponse.json(
                    { success: false, error: 'No available student leads found' },
                    { status: 404 }
                );
            }

            // Update facultyMentors table
            let updateQuery = 'UPDATE facultyMentors SET ';
            let updateValues = [];
            let fields = [];

            // Assign leads to available slots
            for (let i = 0; i < availableLeads.length; i++) {
                const lead = availableLeads[i];
                if (!mentor.lead1Id) {
                    fields.push('lead1Id = ?');
                    updateValues.push(lead.username);
                } else if (!mentor.lead2Id) {
                    fields.push('lead2Id = ?');
                    updateValues.push(lead.username);
                }
            }

            if (fields.length > 0) {
                updateQuery += fields.join(', ');
                updateQuery += ' WHERE username = ?';
                updateValues.push(username);

                await connection.query(updateQuery, updateValues);
            }

            // Update studentLeads table
            for (const lead of availableLeads) {
                await connection.query(
                    'UPDATE studentLeads SET facultyMentorId = ? WHERE username = ?',
                    [username, lead.username]
                );
            }

            return NextResponse.json({
                success: true,
                leads: availableLeads
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in fetch leads API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
} 