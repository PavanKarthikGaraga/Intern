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

        const [mentors] = await pool.query(`
            SELECT f.id, f.name, f.username, u.createdAt
            FROM facultyMentors f
            JOIN users u ON f.username = u.username
            WHERE f.name LIKE ? OR f.username LIKE ?
            ORDER BY f.id DESC
            LIMIT ? OFFSET ?
        `, [`%${search}%`, `%${search}%`, limit, offset]);

        const [total] = await pool.query(`
            SELECT COUNT(*) as total
            FROM facultyMentors f
            JOIN users u ON f.username = u.username
            WHERE f.name LIKE ? OR f.username LIKE ?
        `, [`%${search}%`, `%${search}%`]);

        return NextResponse.json({
            success: true,
            mentors,
            total: total[0].total
        });
    } catch (error) {
        console.error('Error fetching mentors:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch mentors' },
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

        // Start transaction
        await pool.query('START TRANSACTION');

        try {
            // Insert into users table
            await pool.query(
                'INSERT INTO users (username, name, password, role) VALUES (?, ?, ?, ?)',
                [username, name, hashedPassword, 'facultyMentor']
            );

            // Insert into facultyMentors table
            await pool.query(
                'INSERT INTO facultyMentors (username, name) VALUES (?, ?)',
                [username, name]
            );

            await pool.query('COMMIT');
            return NextResponse.json({ success: true });
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error adding mentor:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to add mentor' },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const { mentorId } = await request.json();

        // Start transaction
        await pool.query('START TRANSACTION');

        try {
            // Get username from facultyMentors table
            const [mentor] = await pool.query(
                'SELECT username FROM facultyMentors WHERE id = ?',
                [mentorId]
            );

            if (mentor.length === 0) {
                throw new Error('Mentor not found');
            }

            const username = mentor[0].username;

            // Delete from facultyMentors table
            await pool.query('DELETE FROM facultyMentors WHERE id = ?', [mentorId]);

            // Delete from users table
            await pool.query('DELETE FROM users WHERE username = ?', [username]);

            await pool.query('COMMIT');
            return NextResponse.json({ success: true });
        } catch (error) {
            await pool.query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        console.error('Error deleting mentor:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to delete mentor' },
            { status: 500 }
        );
    }
} 