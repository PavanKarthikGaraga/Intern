import getDBConnection from "@/lib/db";
import { NextResponse } from 'next/server';

export async function GET(request) {
    let db;
    try {
        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('search') || '';
        const mentorId = searchParams.get('mentorId');

        db = await getDBConnection();

        // First verify if the mentor exists if mentorId is provided
        if (mentorId) {
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
        }

        let query = `
            SELECT 
                cs.studentDetails,
                cs.mentorId,
                sm.name as mentorName,
                sm.domain as mentorDomain
            FROM completedStudents cs
            LEFT JOIN studentMentors sm ON cs.mentorId = sm.mentorId
        `;

        const queryParams = [];

        if (mentorId) {
            query += ' WHERE cs.mentorId = ?';
            queryParams.push(mentorId);
        }

        const [completedStudents] = await db.execute(query, queryParams);

        if (completedStudents.length === 0) {
            return NextResponse.json({
                success: true,
                completedStudents: []
            });
        }

        // Transform the JSON object into array format
        let allStudents = [];
        completedStudents.forEach(record => {
            const studentDetails = record.studentDetails;
            const students = Object.entries(studentDetails).map(([idNumber, details]) => ({
                idNumber,
                name: details.name,
                completionDate: details.completionDate,
                mentorId: record.mentorId,
                mentorName: record.mentorName,
                selectedDomain: details.domain || record.mentorDomain
            }));
            allStudents = [...allStudents, ...students];
        });

        // Filter students based on search query if provided
        const filteredStudents = searchQuery 
            ? allStudents.filter(student => 
                student.idNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.selectedDomain?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            : allStudents;

        return NextResponse.json({
            success: true,
            completedStudents: filteredStudents
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