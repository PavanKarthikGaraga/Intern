import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

const ensureTable = async (db) => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS pblDeadlines (
            slot INT NOT NULL,
            dayNum INT NOT NULL,
            start_date DATETIME NOT NULL,
            end_date DATETIME NOT NULL,
            updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (slot, dayNum)
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `);
};

export async function GET(req) {
    let db;
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = await verifyAccessToken(token);
        if (decoded.role !== 'admin')
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        db = await pool.getConnection();
        await ensureTable(db);
        
        const [rows] = await db.query("SELECT slot, dayNum, DATE_FORMAT(start_date, '%Y-%m-%dT%H:%i:%s.000Z') as start_date, DATE_FORMAT(end_date, '%Y-%m-%dT%H:%i:%s.000Z') as end_date FROM pblDeadlines ORDER BY slot ASC, dayNum ASC");
        
        return NextResponse.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching PBL deadlines:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (db) db.release();
    }
}

export async function PUT(req) {
    let db;
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = await verifyAccessToken(token);
        if (decoded.role !== 'admin')
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { slot, dayNum, start_date, end_date } = await req.json();

        if (!slot || !dayNum || !start_date || !end_date) {
            return NextResponse.json({ error: 'Missing slot, dayNum, start_date or end_date' }, { status: 400 });
        }

        if (slot < 10) {
            return NextResponse.json({ error: 'PBL deadlines are only for slot 10 onwards.' }, { status: 400 });
        }

        const parsedStartDate = new Date(`${start_date}+05:30`);
        const parsedEndDate = new Date(`${end_date}+05:30`);
        if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEndDate.getTime())) {
            return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
        }

        if (parsedStartDate.getTime() >= parsedEndDate.getTime()) {
            return NextResponse.json({ error: 'Start date must be before end date' }, { status: 400 });
        }

        db = await pool.getConnection();
        await ensureTable(db);
        
        await db.query(
            'INSERT INTO pblDeadlines (slot, dayNum, start_date, end_date) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE start_date = ?, end_date = ?',
            [slot, dayNum, parsedStartDate, parsedEndDate, parsedStartDate, parsedEndDate]
        );
        
        return NextResponse.json({ success: true, message: 'Deadline updated successfully' });
    } catch (error) {
        console.error('Error updating PBL deadline:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (db) db.release();
    }
}
