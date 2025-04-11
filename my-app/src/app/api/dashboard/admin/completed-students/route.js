import getDBConnection from "@/lib/db";
import { NextResponse } from 'next/server';

export async function GET(request) {
    let db;
    try {
        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('search') || '';

        db = await getDBConnection();

        const query = `
            SELECT 
                cs.studentDetails,
                cs.mentorId,
                sm.name as mentorName
            FROM completedStudents cs
            LEFT JOIN studentMentors sm ON cs.mentorId = sm.mentorId
        `;

        const [completedStudents] = await db.execute(query);

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
                mentorName: record.mentorName
            }));
            allStudents = [...allStudents, ...students];
        });

        // Filter students based on search query if provided
        const filteredStudents = searchQuery 
            ? allStudents.filter(student => 
                student.idNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.name?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            : allStudents;

        return NextResponse.json({
            success: true,
            completedStudents: filteredStudents
        });

    } catch (error) {
        console.error('Error fetching completed students:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
} 