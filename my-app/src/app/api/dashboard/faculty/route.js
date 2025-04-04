import getDBConnection from "@/lib/db";

export async function GET(request) {
    let db;
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 20;
        const search = searchParams.get('search') || '';
        const offset = (page - 1) * limit;

        db = await getDBConnection();

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(DISTINCT r.idNumber) as count
            FROM registrations r
            WHERE r.name LIKE ? 
            OR r.idNumber LIKE ? 
            OR r.selectedDomain LIKE ?
        `;
        const searchPattern = `%${search}%`;
        const [totalCount] = await db.execute(countQuery, [searchPattern, searchPattern, searchPattern]);

        const query = `
            SELECT 
                r.*,
                COALESCE(
                    (SELECT 
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
                    ), 0
                ) as daysCompleted,
                MAX(sm.name) as mentorName,
                MAX(sm.mentorId) as mentorId
            FROM registrations r
            LEFT JOIN attendance a ON r.idNumber = a.idNumber
            LEFT JOIN studentMentors sm ON 
                r.idNumber IN (
                    sm.student1Id, sm.student2Id, sm.student3Id,
                    sm.student4Id, sm.student5Id, sm.student6Id,
                    sm.student7Id, sm.student8Id, sm.student9Id,
                    sm.student10Id
                )
            WHERE r.name LIKE ? 
            OR r.idNumber LIKE ? 
            OR r.selectedDomain LIKE ?
            GROUP BY 
                r.idNumber, r.name, r.email, r.selectedDomain, 
                r.branch, r.gender, r.year, r.phoneNumber,
                r.residenceType, r.hostelType, r.busRoute,
                r.country, r.state, r.district, r.pincode,
                r.createdAt, r.updatedAt
            ORDER BY r.idNumber
            LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
        `;
        
        const [reports] = await db.execute(query, [searchPattern, searchPattern, searchPattern]);

        return new Response(
            JSON.stringify({
                reports,
                pagination: {
                    total: totalCount[0].count,
                    currentPage: page,
                    totalPages: Math.ceil(totalCount[0].count / limit),
                    limit
                }
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error fetching registrations:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
}

export async function POST(request) {
    let db;
    try {
        db = await getDBConnection();
        const { studentId } = await request.json();

        const query = `
            SELECT 
                idNumber,
                day1Link,
                day2Link,
                day3Link,
                day4Link,
                day5Link,
                day6Link,
                day7Link,
                day8Link
            FROM uploads
            WHERE idNumber = ?
        `;
        const [uploads] = await db.execute(query, [studentId]);

        return new Response(
            JSON.stringify(uploads[0] || {}),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error fetching uploads:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
}
