import { NextResponse } from 'next/server';
import pool  from '@/lib/db';

export async function POST(req) {
    try {
        const { username } = await req.json();

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        // Get studentLead details
        const [studentLead] = await pool.query(
            `SELECT * FROM studentLeads WHERE username = ?`,
            [username]
        );

        if (!studentLead || studentLead.length === 0) {
            return NextResponse.json({ error: 'Student lead not found' }, { status: 404 });
        }

        // Count total students assigned to this lead
        const [students] = await pool.query(
            `SELECT COUNT(*) as totalStudents FROM registrations WHERE studentLeadId = ?`,
            [username]
        );

        // Get faculty mentor details
        const [mentor] = await pool.query(
            `SELECT name FROM facultyMentors WHERE username = ?`,
            [studentLead[0].facultyMentorId]
        );

        return NextResponse.json({
            success: true,
            studentLead: {
                ...studentLead[0],
                totalStudents: students[0].totalStudents,
                mentorName: mentor[0]?.name || 'Not assigned'
            }
        });

    } catch (error) {
        console.error('Error in studentLead overview:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
} 