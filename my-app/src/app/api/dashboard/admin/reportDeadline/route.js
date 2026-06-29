import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { cookies } from 'next/headers';

const verifyAdmin = async () => {
    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('accessToken');

    if (!accessToken?.value) {
        return null;
    }

    const decoded = await verifyAccessToken(accessToken.value);
    if (!decoded || decoded.role !== 'admin') {
        return null;
    }
    return decoded;
};

export async function GET() {
    try {
        const admin = await verifyAdmin();
        if (!admin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Auto-create table if missing for smooth deployment
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reportDeadlines (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                slot INT NOT NULL UNIQUE,
                deadline DATETIME NOT NULL,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
        `);
        // Insert defaults if empty
        await pool.query(`
            INSERT IGNORE INTO reportDeadlines (slot, deadline) VALUES
            (1, '2026-05-29 12:30:00'),
            (2, '2026-05-30 12:30:00'),
            (3, '2026-05-30 12:30:00'),
            (4, '2026-05-30 12:30:00'),
            (5, '2026-05-30 12:30:00'),
            (6, '2026-05-30 12:30:00'),
            (7, '2026-06-30 12:30:00'),
            (8, '2026-06-30 12:30:00'),
            (9, '2026-06-30 12:30:00')
        `);

        const [rows] = await pool.query("SELECT slot, DATE_FORMAT(deadline, '%Y-%m-%dT%H:%i:%s.000Z') as deadline FROM reportDeadlines ORDER BY slot ASC");
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

        // Validate date string (Append +05:30 to explicitly parse as IST)
        const parsedDate = new Date(`${deadline}+05:30`);
        if (isNaN(parsedDate.getTime())) {
            return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
        }
        
        // MySQL expects YYYY-MM-DD HH:MM:SS (Save in UTC)
        const mysqlDate = parsedDate.toISOString().slice(0, 19).replace('T', ' ');

        await pool.query(
            'INSERT INTO reportDeadlines (slot, deadline) VALUES (?, ?) ON DUPLICATE KEY UPDATE deadline = ?',
            [slot, mysqlDate, mysqlDate]
        );

        return NextResponse.json({ success: true, message: 'Deadline updated successfully' });
    } catch (error) {
        console.error('Error updating deadline:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
