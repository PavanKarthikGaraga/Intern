import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(req) {
    let db;
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('accessToken')?.value;
        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decoded = await verifyAccessToken(token);
        if (decoded.role !== 'student')
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const slot = searchParams.get('slot');

        if (!slot) {
            return NextResponse.json({ error: 'Missing slot parameter' }, { status: 400 });
        }

        db = await pool.getConnection();
        
        // Ensure table exists just in case
        try {
            const [cols] = await db.query("SHOW COLUMNS FROM pblDeadlines LIKE 'dayNum'");
            if (cols.length === 0) {
                await db.query("DROP TABLE pblDeadlines");
            }
        } catch (e) {}

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
        
        const [rows] = await db.query(
            "SELECT dayNum, DATE_FORMAT(start_date, '%Y-%m-%dT%H:%i:%s.000Z') as start_date, DATE_FORMAT(end_date, '%Y-%m-%dT%H:%i:%s.000Z') as end_date FROM pblDeadlines WHERE slot = ?", 
            [slot]
        );
        
        if (rows.length === 0) {
            return NextResponse.json({ success: true, data: null });
        }
        
        // Map rows into an object keyed by dayNum
        const dataByDay = {};
        rows.forEach(row => {
            dataByDay[row.dayNum] = {
                start_date: row.start_date,
                end_date: row.end_date
            };
        });
        
        return NextResponse.json({ success: true, data: dataByDay });
    } catch (error) {
        console.error('Error fetching PBL deadline for student:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (db) db.release();
    }
}
