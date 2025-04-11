import { NextResponse } from 'next/server';
import getDBConnection from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(request) {
    let db;
    try {
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ 
                success: false, 
                error: 'Authentication required' 
            }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied' 
            }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const mentorId = searchParams.get('mentorId');

        if (!mentorId) {
            return NextResponse.json({ 
                success: false, 
                error: 'Mentor ID is required' 
            }, { status: 400 });
        }

        db = await getDBConnection();
        
        // First verify if the mentor exists
        const [mentorCheck] = await db.execute(`
            SELECT mentorId, domain 
            FROM studentMentors 
            WHERE mentorId = ?
        `, [mentorId]);

        if (!mentorCheck || mentorCheck.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Mentor not found'
            }, { status: 404 });
        }

        // Fetch completed students data from completedStudents table
        const [result] = await db.execute(`
            SELECT cs.studentDetails
            FROM completedStudents cs
            WHERE cs.mentorId = ?
        `, [mentorId]);

        if (!result || result.length === 0) {
            return NextResponse.json({
                success: true,
                students: []
            });
        }

        // Parse the studentDetails JSON
        const studentDetails = result[0].studentDetails;
        const students = Object.entries(studentDetails).map(([idNumber, details]) => ({
            idNumber,
            name: details.name,
            selectedDomain: mentorCheck[0].domain,
            completionDate: details.completionDate
        }));

        return NextResponse.json({
            success: true,
            students
        });

    } catch (error) {
        console.error('Error fetching completed students:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to fetch completed students: ' + error.message 
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