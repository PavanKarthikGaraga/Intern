import getDBConnection from '../../../lib/db';

export async function POST(request) {
    let db;
    try {
        const { link, studentId, dayNumber } = await request.json();

        if (!link || !studentId || !dayNumber) {
            return Response.json({ 
                error: 'Missing required fields' 
            }, { status: 400 });
        }

        db = await getDBConnection();

        // Verify if student exists
        const [student] = await db.query(
            'SELECT idNumber FROM registrations WHERE idNumber = ?',
            [studentId]
        );

        if (!student || student.length === 0) {
            return Response.json({ 
                error: 'Student not found' 
            }, { status: 404 });
        }

        // Insert or update upload record
        await db.query(
            `INSERT INTO uploads (studentId, dayNumber, link)
             VALUES (?, ?, ?)
             ON DUPLICATE KEY UPDATE 
             link = VALUES(link),
             updatedAt = CURRENT_TIMESTAMP`,
            [studentId, dayNumber, link]
        );

        return Response.json({ 
            success: true,
            message: 'Link uploaded successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('Upload error:', error);
        return Response.json({ 
            error: 'Error processing upload' 
        }, { status: 500 });
    } finally {
        if (db) await db.end();
    }
}
