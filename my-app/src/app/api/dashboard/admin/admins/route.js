import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function GET(req) {
    try {
        const cookieStore = await cookies();
        const   accessToken = await cookieStore.get('accessToken');

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

        // Get all admins with their details
        const [admins] = await pool.query(`
            SELECT username, name
            FROM users
            WHERE role = 'admin'
            ORDER BY name ASC
        `);

        return NextResponse.json({
            success: true,
            admins
        });

    } catch (error) {
        console.error('Error in admin list API:', error);
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
                error: 'Access denied. Only admin members can add other admins.' 
            }, { status: 403 });
        }

        const { username, name } = await req.json();

        // Validate required fields
        if (!username || !name) {
            return NextResponse.json({ 
                success: false, 
                error: 'Username and name are required' 
            }, { status: 400 });
        }

        // Generate default password
        const defaultPassword = `${username}@sac`;
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // Insert into users table
        await pool.query(
            'INSERT INTO users (username, name, password, role) VALUES (?, ?, ?, ?)',
            [username, name, hashedPassword, 'admin']
        );

        return NextResponse.json({ 
            success: true, 
            message: 'Admin added successfully' 
        });
    } catch (error) {
        console.error('Error adding admin:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json({ 
                success: false, 
                error: 'Username already exists' 
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
                error: 'Access denied. Only admin members can delete other admins.' 
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

        // Prevent self-deletion
        if (username === decoded.username) {
            return NextResponse.json({ 
                success: false, 
                error: 'Cannot delete your own admin account' 
            }, { status: 400 });
        }

        // Delete from users table
        await pool.query('DELETE FROM users WHERE username = ? AND role = ?', [username, 'admin']);

        return NextResponse.json({ 
            success: true, 
            message: 'Admin deleted successfully' 
        });
    } catch (error) {
        console.error('Error deleting admin:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
} 