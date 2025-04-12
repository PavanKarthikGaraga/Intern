import { NextResponse } from 'next/server';
import getDBConnection from "@/lib/db";
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
            return NextResponse.json({ error: 'Only admin members can search students' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || '';
        const domain = searchParams.get('domain') || '';
        
        if (!domain) {
            return NextResponse.json(
                { success: false, error: 'Domain is required' },
                { status: 400 }
            );
        }
        
        db = await getDBConnection();
        
        const searchQuery = `
            SELECT 
                r.idNumber,
                r.name,
                r.selectedDomain,
                r.branch,
                r.year
            FROM registrations r
            LEFT JOIN users u ON r.idNumber = u.idNumber
            WHERE (r.name LIKE ? OR r.idNumber LIKE ?)
            AND (u.role = 'student' OR u.role IS NULL)
            AND r.idNumber NOT IN (SELECT mentorId FROM studentMentors)
            AND r.selectedDomain = ?
            LIMIT 10
        `;
        
        const searchPattern = `%${query}%`;
        const [students] = await db.execute(searchQuery, [searchPattern, searchPattern, domain]);

        return NextResponse.json({
            success: true,
            students
        });

    } catch (err) {
        console.error("Error searching students:", err);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
} 