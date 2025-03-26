import getDBConnection from "@/lib/db";

export async function GET(request) {
    let db;
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query') || '';
        
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
            LIMIT 10
        `;
        
        const searchPattern = `%${query}%`;
        const [students] = await db.execute(searchQuery, [searchPattern, searchPattern]);

        return new Response(
            JSON.stringify({
                success: true,
                students
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error searching students:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
} 