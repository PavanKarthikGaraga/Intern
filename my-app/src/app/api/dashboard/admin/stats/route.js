import { NextResponse } from 'next/server';
import getDBConnection from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET() {
    let db;
    try {
        // Validate admin session using JWT
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ 
                success: false, 
                error: 'Authentication required. Please login again.' 
            }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only admin members can view statistics.' 
            }, { status: 403 });
        }

        // Connect to database
        db = await getDBConnection();
        if (!db) {
            throw new Error('Database connection failed');
        }

        // Get all students and mentors in parallel for better performance
        const [students, mentors] = await Promise.all([
            db.execute('SELECT * FROM registrations'),
            db.execute('SELECT * FROM studentMentors')
        ]);

        if (!students || !students[0]) {
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch student data'
            }, { status: 500 });
        }

        const studentData = students[0];
        const mentorData = mentors[0];

        // Get unique domains with validation
        const domains = [...new Set(studentData
            .map(student => student.selectedDomain)
            .filter(domain => domain && typeof domain === 'string')
        )];

        // Calculate domain-wise statistics with validation
        const studentsPerDomain = domains.reduce((acc, domain) => {
            const domainStudents = studentData.filter(student => student.selectedDomain === domain);
            const mentorsInDomain = mentorData.filter(mentor => mentor.domain === domain);

            acc[domain] = {
                total: domainStudents.length,
                active: domainStudents.filter(student => !student.completed).length,
                completed: domainStudents.filter(student => student.completed).length,
                mentors: mentorsInDomain.length
            };
            return acc;
        }, {});

        // Calculate overall statistics
        const totalStudents = studentData.length;
        const activeStudents = studentData.filter(student => !student.completed).length;
        const completedStudents = studentData.filter(student => student.completed).length;
        const totalMentors = mentorData.length;

        // Calculate completion rate
        const completionRate = totalStudents > 0 
            ? ((completedStudents / totalStudents) * 100).toFixed(2) 
            : 0;

        return NextResponse.json({
            success: true,
            totalStudents,
            activeStudents,
            completedStudents,
            totalMentors,
            completionRate,
            domains,
            studentsPerDomain
        });

    } catch (error) {
        console.error('Error in admin stats endpoint:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error while fetching statistics'
        }, { status: 500 });
    } finally {
        if (db) {
            try {
                await db.end();
            } catch (error) {
                console.error('Error closing database connection:', error);
            }
        }
    }
} 