import getDBConnection from '../../../lib/db';

export async function POST(request) {
    let db;
    try {
        const formData = await request.formData();
        const file = formData.get('file');
        const studentId = formData.get('studentId');
        const dayNumber = formData.get('dayNumber');

        if (!file) {
            return Response.json({ error: 'No file provided' }, { status: 400 });
        }

        // Convert file to buffer
        const buffer = await file.arrayBuffer();
        const fileContent = Buffer.from(buffer);

        db = await getDBConnection();

        // Save file to uploads table with content
        await db.query(
            `INSERT INTO uploads (
                studentId, 
                dayNumber,
                fileName,
                fileContent,
                uploadStatus
            ) VALUES (?, ?, ?, ?, 'success')`,
            [
                studentId,
                dayNumber,
                file.name,
                fileContent
            ]
        );

        return Response.json({ 
            success: true,
            message: 'File uploaded successfully'
        }, { status: 200 });

    } catch (error) {
        console.error('Upload error:', error);
        return Response.json({ 
            success: false,
            error: 'Error uploading file' 
        }, { status: 500 });
    } finally {
        if (db) await db.end();
    }
}
