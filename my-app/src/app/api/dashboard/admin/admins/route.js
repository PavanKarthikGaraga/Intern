import { NextResponse } from 'next/server';
import { pool } from '@/config/db';
import bcrypt from 'bcryptjs';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const offset = (page - 1) * limit;

        const [admins] = await pool.query(`
            SELECT id, name, username, createdAt
            FROM users
            WHERE role = 'admin' AND (name LIKE ? OR username LIKE ?)
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        `, [`%${search}%`, `%${search}%`, limit, offset]);

        const [total] = await pool.query(`
            SELECT COUNT(*) as total
            FROM users
            WHERE role = 'admin' AND (name LIKE ? OR username LIKE ?)
        `, [`%${search}%`, `%${search}%`]);

        return NextResponse.json({
            success: true,
            admins,
            total: total[0].total
        });
    } catch (error) {
        console.error('Error fetching admins:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch admins' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const { name, username, password } = await request.json();

        // Check if username already exists
        const [existingUser] = await pool.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (existingUser.length > 0) {
            return NextResponse.json(
                { success: false, error: 'Username already exists' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert into users table
        await pool.query(
            'INSERT INTO users (username, name, password, role) VALUES (?, ?, ?, ?)',
            [username, name, hashedPassword, 'admin']
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error adding admin:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add admin' },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const { adminId } = await request.json();

        // Delete from users table
        await pool.query('DELETE FROM users WHERE id = ? AND role = ?', [adminId, 'admin']);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting admin:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete admin' },
            { status: 500 }
        );
    }
} 