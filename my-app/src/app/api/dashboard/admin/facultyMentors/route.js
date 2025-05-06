import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function GET(req) {
    try {
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ 
                success: false, 
                error: 'Authentication required. Please login again.' 
            }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only admin members can access this data.' 
            }, { status: 403 });
        }

        // Verify that the user is an admin in database
        const userQuery = 'SELECT role FROM users WHERE username = ?';
        const [userRows] = await pool.query(userQuery, [decoded.username]);

        if (!userRows || userRows.length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'User not found in database' 
            }, { status: 404 });
        }

        const userRole = userRows[0].role;

        if (userRole !== 'admin') {
            return NextResponse.json({ 
                success: false, 
                error: `User role is ${userRole}, but admin role is required` 
            }, { status: 403 });
        }

        // Get all faculty mentors with their details
        const [mentors] = await pool.query(`
            SELECT 
                fm.username,
                fm.name,
                fm.email,
                fm.phoneNumber,
                (
                    SELECT COUNT(*)
                    FROM studentLeads sl
                    WHERE sl.facultyMentorId = fm.username
                ) as totalLeads,
                (
                    SELECT COUNT(*)
                    FROM registrations r
                    WHERE r.facultyMentorId = fm.username
                ) as totalStudents
            FROM facultyMentors fm
            ORDER BY fm.name ASC
        `);

        return NextResponse.json({
            success: true,
            mentors
        });

    } catch (error) {
        console.error('Error in admin faculty mentors API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function POST(req) {
    try {
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ 
                success: false, 
                error: 'Authentication required. Please login again.' 
            }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only admin members can add faculty mentors.' 
            }, { status: 403 });
        }

        const { username, name, phoneNumber, email } = await req.json();

        // Validate required fields
        if (!username || !name || !phoneNumber || !email) {
            return NextResponse.json({ 
                success: false, 
                error: 'All fields are required' 
            }, { status: 400 });
        }

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // Generate a default password (first 6 digits of phone number)
            const defaultPassword = username + phoneNumber.slice(-4);
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);

            // Insert into users table
            await connection.query(
                'INSERT INTO users (username, name, password, role) VALUES (?, ?, ?, ?)',
                [username, name, hashedPassword, 'facultyMentor']
            );

            // Insert into facultyMentors table
            await connection.query(
                'INSERT INTO facultyMentors (username, name, phoneNumber, email) VALUES (?, ?, ?, ?)',
                [username, name, phoneNumber, email]
            );

            await connection.commit();
            return NextResponse.json({ 
                success: true, 
                message: 'Faculty mentor added successfully' 
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error adding faculty mentor:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ 
                success: false, 
                error: 'Username or phone number already exists' 
            }, { status: 400 });
        }
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function DELETE(req) {
    try {
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ 
                success: false, 
                error: 'Authentication required. Please login again.' 
            }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only admin members can delete faculty mentors.' 
            }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json({ 
                success: false, 
                error: 'Username is required' 
            }, { status: 400 });
        }

        // Start transaction
        const connection = await pool.getConnection();
        await connection.beginTransaction();

        try {
            // First, update any studentLeads to remove this faculty mentor
            await connection.query(
                'UPDATE studentLeads SET facultyMentorId = NULL WHERE facultyMentorId = ?',
                [username]
            );

            // Then, update any registrations to remove this faculty mentor
            await connection.query(
                'UPDATE registrations SET facultyMentorId = NULL WHERE facultyMentorId = ?',
                [username]
            );

            // Delete from facultyMentors table
            await connection.query('DELETE FROM facultyMentors WHERE username = ?', [username]);
            
            // Delete from users table
            await connection.query('DELETE FROM users WHERE username = ?', [username]);

            await connection.commit();
            return NextResponse.json({ 
                success: true, 
                message: 'Faculty mentor deleted successfully' 
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error deleting faculty mentor:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(req) {
    try {
        const { username, name, email, phoneNumber, branch } = await req.json();

        if (!username || !name || !email || !phoneNumber) {
            return NextResponse.json(
                { success: false, error: 'All fields are required' },
                { status: 400 }
            );
        }

        const connection = await pool.getConnection();

        try {
            // Update faculty mentor details
            await connection.query(
                `UPDATE facultyMentors 
                 SET name = ?, email = ?, phoneNumber = ?, branch = ?
                 WHERE username = ?`,
                [name, email, phoneNumber, branch, username]
            );

            // Update user details
            await connection.query(
                `UPDATE users 
                 SET name = ?
                 WHERE username = ?`,
                [name, username]
            );

            return NextResponse.json({
                success: true,
                message: 'Faculty mentor updated successfully'
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in update faculty mentor API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
} 