import { NextResponse } from 'next/server';
import getDBConnection from '@/lib/db';

export async function POST(request) {
    try {
        const { studentId } = await request.json();

        if (!studentId) {
            return NextResponse.json(
                { success: false, error: 'Student ID is required' },
                { status: 400 }
            );
        }

        const connection = await getDBConnection();
        
        try {
            // Fetch uploads for the specified student
            const [uploads] = await connection.execute(
                `SELECT u.*, r.name as student_name 
                 FROM uploads u 
                 JOIN registrations r ON u.idNumber = r.idNumber 
                 WHERE u.idNumber = ?`,
                [studentId]
            );

            if (!uploads || uploads.length === 0) {
                return NextResponse.json({
                    success: true,
                    uploads: []
                });
            }

            // Transform the uploads data to match the expected format
            const upload = uploads[0];
            const transformedUploads = [];

            for (let i = 1; i <= 8; i++) {
                const dayLink = upload[`day${i}Link`];
                if (dayLink) {
                    transformedUploads.push({
                        dayNumber: i,
                        link: dayLink,
                        studentName: upload.student_name
                    });
                }
            }

            return NextResponse.json({
                success: true,
                uploads: transformedUploads
            });

        } finally {
            await connection.end();
        }

    } catch (error) {
        console.error('Error fetching uploads:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch uploads' },
            { status: 500 }
        );
    }
} 