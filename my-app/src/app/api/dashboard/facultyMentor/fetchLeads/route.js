import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(req) {
    const connection = await pool.getConnection();
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

        await connection.beginTransaction();

        try {
            // Get current faculty mentor data
            const [mentorData] = await connection.query(
                'SELECT * FROM facultyMentors WHERE username = ?',
                [username]
            );

            if (!mentorData.length) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, error: 'Faculty mentor not found' },
                    { status: 404 }
                );
            }

            const mentor = mentorData[0];

            console.log('Current mentor state:', {
                username: mentor.username,
                lead1Id: mentor.lead1Id,
                lead2Id: mentor.lead2Id
            });

            // Check if mentor already has 2 leads
            if (mentor.lead1Id && mentor.lead2Id) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, error: 'You already have 2 student leads assigned' },
                    { status: 400 }
                );
            }

            // Calculate number of available slots
            const availableSlots = (!mentor.lead1Id ? 1 : 0) + (!mentor.lead2Id ? 1 : 0);
            console.log('Available slots:', availableSlots);

            // Fetch available student leads (those not assigned to any faculty mentor)
            const [availableLeads] = await connection.query(
                `SELECT * FROM studentLeads 
                 WHERE facultyMentorId IS NULL 
                 ORDER BY createdAt ASC 
                 LIMIT ?`,
                [availableSlots]
            );

            console.log('Available leads:', availableLeads);

            if (availableLeads.length === 0) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, error: 'No available student leads found' },
                    { status: 404 }
                );
            }

            // Update facultyMentors table
            let updateValues = [];
            let updateFields = [];

            // First, determine which slots are available and assign leads accordingly
            if (!mentor.lead1Id && availableLeads.length > 0) {
                updateFields.push('lead1Id = ?');
                updateValues.push(availableLeads[0].username);
            }
            
            if (!mentor.lead2Id && availableLeads.length > 1) {
                updateFields.push('lead2Id = ?');
                updateValues.push(availableLeads[1].username);
            }

            if (updateFields.length > 0) {
                const updateQuery = `UPDATE facultyMentors SET ${updateFields.join(', ')} WHERE username = ?`;
                updateValues.push(username);

                console.log('Update Query:', updateQuery);
                console.log('Update Values:', updateValues);

                await connection.query(updateQuery, updateValues);
            }

            // Update studentLeads table
            for (const lead of availableLeads) {
                console.log('Updating student lead:', lead.username, 'with faculty mentor:', username);
                await connection.query(
                    'UPDATE studentLeads SET facultyMentorId = ? WHERE username = ?',
                    [username, lead.username]
                );
            }

            // Verify the update
            const [verifyMentor] = await connection.query(
                'SELECT lead1Id, lead2Id FROM facultyMentors WHERE username = ?',
                [username]
            );
            console.log('Mentor state after update:', verifyMentor[0]);

            await connection.commit();

            return NextResponse.json({
                success: true,
                leads: availableLeads,
                message: `Successfully assigned ${availableLeads.length} student lead(s)`
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Error in fetch leads API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
} 