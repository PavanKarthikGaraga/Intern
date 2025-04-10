import { NextResponse } from 'next/server';
import getDBConnection from '@/lib/db';

export async function GET(request) {
    let db;
    try {
        const { searchParams } = new URL(request.url);
        const studentId = searchParams.get('studentId');

        if (!studentId) {
            return NextResponse.json({ error: 'Student ID is required' }, { status: 400 });
        }

        db = await getDBConnection();
        
        // Get all uploads for the student
        const [uploads] = await db.execute(`
            SELECT 
                idNumber,
                day1Link,
                day2Link,
                day3Link,
                day4Link,
                day5Link,
                day6Link,
                day7Link,
                day8Link,
                createdAt
            FROM uploads 
            WHERE idNumber = ?
        `, [studentId]);

        // Transform the data into the expected format
        const formattedUploads = [];
        
        if (uploads.length > 0) {
            const upload = uploads[0];
            for (let i = 1; i <= 8; i++) {
                const link = upload[`day${i}Link`];
                if (link) {
                    formattedUploads.push({
                        dayNumber: i,
                        link: link,
                        createdAt: upload.createdAt
                    });
                }
            }
        }

        return NextResponse.json({ 
            success: true,
            uploads: formattedUploads 
        });

    } catch (error) {
        console.error('Error fetching uploads:', error);
        return NextResponse.json(
            { error: 'Failed to fetch uploads' },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
} 