import getDBConnection from '../../../../lib/db';

export async function POST(request) {
    let db;
    try {
        const { studentId } = await request.json();
        
        if (!studentId) {
            return Response.json({ 
                error: 'Student ID is required' 
            }, { status: 400 });
        }

        db = await getDBConnection();

        const [uploads] = await db.query(
            `SELECT * FROM uploads 
             WHERE studentId = ? 
             ORDER BY dayNumber ASC`,
            [studentId]
        );

        return Response.json(uploads, { status: 200 });

    } catch (error) {
        console.error('Fetch uploads error:', error);
        return Response.json({ 
            error: 'Failed to fetch uploads' 
        }, { status: 500 });
    } finally {
        if (db) await db.end();
    }
}
