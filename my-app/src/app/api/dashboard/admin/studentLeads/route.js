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

        // Get all student leads with their faculty mentor names
        const [leads] = await pool.query(`
            SELECT 
                sl.*,
                fm.name as facultyMentorName,
                (
                    SELECT COUNT(*)
                    FROM registrations r
                    WHERE r.studentLeadId = sl.username
                ) as totalStudents
            FROM studentLeads sl
            LEFT JOIN facultyMentors fm ON sl.facultyMentorId = fm.username
            ORDER BY sl.name ASC
        `);

        return NextResponse.json({ success: true, leads });
    } catch (error) {
        console.error('Error in student leads API:', error);
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
                error: 'Access denied. Only admin members can add student leads.' 
            }, { status: 403 });
        }

        const { username, name, phoneNumber, email, slot } = await req.json();

        // Validate required fields
        if (!username || !name || !phoneNumber || !email || !slot) {
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
                [username, name, hashedPassword, 'studentLead']
            );

            // Insert into studentLeads table
            await connection.query(
                'INSERT INTO studentLeads (username, name, phoneNumber, email, slot) VALUES (?, ?, ?, ?, ?)',
                [username, name, phoneNumber, email, slot]
            );

            await connection.commit();
            return NextResponse.json({ 
                success: true, 
                message: 'Student lead added successfully' 
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error adding student lead:', error);
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
                error: 'Access denied. Only admin members can delete student leads.' 
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
            // Delete from studentLeads table            
            await connection.query(
                'UPDATE facultyMentors SET lead1Id = NULL WHERE lead1Id = ?',
                [username]
              );
              
              await connection.query(
                'UPDATE facultyMentors SET lead2Id = NULL WHERE lead2Id = ?',
                [username]
              );
              
            await connection.query(
                'UPDATE registrations SET studentLeadId = NULL WHERE studentLeadId = ?',
                 [username]);

            await connection.query(
                'DELETE FROM studentLeads WHERE username = ?', 
                [username]);
            
            // Delete from users table
            await connection.query(
                'DELETE FROM users WHERE username = ?',
                 [username]);

            await connection.commit();
            return NextResponse.json({ 
                success: true, 
                message: 'Student lead deleted successfully' 
            });
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error deleting student lead:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(req) {
    try {
        const { username, name, email, phoneNumber, slot, branch } = await req.json();

        if (!username || !name || !email || !phoneNumber || !slot) {
            return NextResponse.json(
                { success: false, error: 'All fields are required' },
                { status: 400 }
            );
        }

        const connection = await pool.getConnection();

        try {
            // Update student lead details
            await connection.query(
                `UPDATE studentLeads 
                 SET name = ?, email = ?, phoneNumber = ?, slot = ?, branch = ?
                 WHERE username = ?`,
                [name, email, phoneNumber, slot, branch, username]
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
                message: 'Student lead updated successfully'
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in update student lead API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
} 