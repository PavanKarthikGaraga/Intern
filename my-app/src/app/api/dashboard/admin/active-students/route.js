import getDBConnection from "@/lib/db";
import { NextResponse } from "next/server";
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
        const search = searchParams.get("search") || "";
        const page = parseInt(searchParams.get("page")) || 1;
        const limit = parseInt(searchParams.get("limit")) || 20;
        const offset = (page - 1) * limit;
        const searchPattern = `%${search}%`;

        db = await getDBConnection();

        // Query for total count (without limit/offset)
        const [countRows] = await db.execute(
            `
            SELECT COUNT(*) as total
            FROM registrations r
            WHERE 
                (r.name LIKE ? OR r.idNumber LIKE ? OR r.selectedDomain LIKE ?)
                AND r.completed = FALSE
                AND r.idNumber NOT IN (
                    SELECT mentorId FROM studentMentors
                )
            `,
            [searchPattern, searchPattern, searchPattern]
        );

        const total = countRows[0].total;

        // Query for actual paginated results
        const query = `
            SELECT 
                r.*,
                COALESCE((
                    SELECT 
                        (CASE WHEN day1 = 'P' THEN 1 ELSE 0 END) +
                        (CASE WHEN day2 = 'P' THEN 1 ELSE 0 END) +
                        (CASE WHEN day3 = 'P' THEN 1 ELSE 0 END) +
                        (CASE WHEN day4 = 'P' THEN 1 ELSE 0 END) +
                        (CASE WHEN day5 = 'P' THEN 1 ELSE 0 END) +
                        (CASE WHEN day6 = 'P' THEN 1 ELSE 0 END) +
                        (CASE WHEN day7 = 'P' THEN 1 ELSE 0 END) +
                        (CASE WHEN day8 = 'P' THEN 1 ELSE 0 END)
                    FROM attendance a
                    WHERE a.idNumber = r.idNumber
                ), 0) AS daysCompleted,

                sm.name AS mentorName,
                sm.mentorId

            FROM registrations r

            LEFT JOIN attendance a ON r.idNumber = a.idNumber

            LEFT JOIN studentMentors sm ON 
                r.idNumber IN (
                    sm.student1Id, sm.student2Id, sm.student3Id,
                    sm.student4Id, sm.student5Id, sm.student6Id,
                    sm.student7Id, sm.student8Id, sm.student9Id,
                    sm.student10Id
                )

            WHERE 
                (r.name LIKE ? OR r.idNumber LIKE ? OR r.selectedDomain LIKE ?)
                AND r.completed = FALSE
                AND r.idNumber NOT IN (
                    SELECT mentorId FROM studentMentors
                )

            GROUP BY 
                r.idNumber, r.name, r.email, r.selectedDomain, 
                r.branch, r.gender, r.year, r.phoneNumber,
                r.residenceType, r.hostelType, r.busRoute,
                r.country, r.state, r.district, r.pincode,
                r.createdAt, r.updatedAt,
                sm.name, sm.mentorId

            ORDER BY r.name
            LIMIT ${limit} OFFSET ${offset};
        `;

        const [students] = await db.execute(query, [
            searchPattern,
            searchPattern,
            searchPattern,
        ]);

        return NextResponse.json({
            success: true,
            students,
            page,
            limit,
            total, // 👈 this is the new field
            totalPages: Math.ceil(total / limit),
        });
    } catch (error) {
        console.error("Error fetching active students:", error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
}
