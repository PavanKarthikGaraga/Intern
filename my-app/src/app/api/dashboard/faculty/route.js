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
                COUNT(u.idNumber) as uploadsCount
            FROM registrations r
            LEFT JOIN uploads u ON r.idNumber = u.idNumber
            WHERE r.name LIKE ? 
            OR r.idNumber LIKE ? 
            OR r.selectedDomain LIKE ?
            GROUP BY r.idNumber
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
        console.error("Error fetching reports:", err);
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
            SELECT *
            FROM uploads
            WHERE idNumber = ?
            ORDER BY dayNumber ASC
        `;
        const [uploads] = await db.execute(query, [studentId]);

        return new Response(
            JSON.stringify(uploads),
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
