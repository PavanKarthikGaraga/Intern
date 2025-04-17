import { NextResponse } from 'next/server';
import getDBConnection from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(request) {
    let db;
    try {
        // Check authentication
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Only admin members can access this resource' }, { status: 403 });
        }

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