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
            // Get faculty mentor's leads
            const [mentorData] = await connection.query(
                'SELECT lead1Id, lead2Id FROM facultyMentors WHERE username = ?',
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
            const leadIds = [mentor.lead1Id, mentor.lead2Id].filter(Boolean);

            if (leadIds.length === 0) {
                await connection.rollback();
                return NextResponse.json({
                    success: true,
                    leads: []
                });
            }

            // Fetch detailed information about the leads
            const [leads] = await connection.query(
                `SELECT 
                    sl.*,
                    (SELECT COUNT(*) FROM registrations r WHERE r.studentLeadId = sl.username) as totalStudents
                 FROM studentLeads sl
                 WHERE sl.username IN (${leadIds.map(() => '?').join(',')})`,
                leadIds
            );

            await connection.commit();

            return NextResponse.json({
                success: true,
                leads
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