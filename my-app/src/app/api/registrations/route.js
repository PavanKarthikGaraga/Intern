import getDBConnection from '../../../lib/db';

export async function GET(request) {
    let db;
    try {
        db = await getDBConnection();

        // Get all registrations with their latest upload status
        const [registrations] = await db.query(`
            SELECT 
                r.*,
                CASE
                    WHEN COUNT(u.id) = 0 THEN 'Pending'
                    WHEN COUNT(u.id) < 5 THEN 'In Progress'
                    ELSE 'Completed'
                END as status,
                COUNT(u.id) as uploadsCount
            FROM registrations r
            LEFT JOIN uploads u ON r.idNumber = u.studentId
            GROUP BY r.idNumber
            ORDER BY r.createdAt DESC
        `);

        return Response.json(registrations, { status: 200 });

    } catch (error) {
        console.error('Fetch registrations error:', error);
        return Response.json({ 
            error: 'Failed to fetch registrations' 
        }, { status: 500 });
    } finally {
        if (db) await db.end();
    }
}
