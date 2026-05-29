import db from '@/lib/db';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';

const verifyAdmin = async () => {
    const headersList = await headers();
    const token = headersList.get('authorization')?.split(' ')[1];
    
    if (!token) return null;
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);
        if (decoded.role !== 'admin') return null;
        return decoded;
    } catch {
        return null;
    }
};

export async function GET() {
    try {
        const admin = await verifyAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Auto-create table if missing for smooth deployment
        await db.query(`
            CREATE TABLE IF NOT EXISTS reportDeadlines (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                slot INT NOT NULL UNIQUE,
                deadline DATETIME NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            );
        `);
        // Insert defaults if empty
        await db.query(`
            INSERT IGNORE INTO reportDeadlines (slot, deadline) VALUES
            (1, '2026-05-29 18:00:00'),
            (2, '2026-05-30 18:00:00'),
            (3, '2026-05-30 18:00:00'),
            (4, '2026-05-30 18:00:00'),
            (5, '2026-05-30 18:00:00'),
            (6, '2026-05-30 18:00:00')
        `);

        const [rows] = await db.query('SELECT slot, deadline FROM reportDeadlines ORDER BY slot ASC');
        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching deadlines:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const admin = await verifyAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { slot, deadline } = await req.json();
        
        if (!slot || !deadline) {
            return NextResponse.json({ error: 'Missing slot or deadline' }, { status: 400 });
        }

        // Validate date string
        const parsedDate = new Date(deadline);
        if (isNaN(parsedDate.getTime())) {
            return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
        }
        
        // MySQL expects YYYY-MM-DD HH:MM:SS
        const mysqlDate = parsedDate.toISOString().slice(0, 19).replace('T', ' ');

        await db.query(
            'UPDATE reportDeadlines SET deadline = ? WHERE slot = ?',
            [mysqlDate, slot]
        );

        return NextResponse.json({ success: true, message: 'Deadline updated successfully' });
    } catch (error) {
        console.error('Error updating deadline:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
