import { NextResponse } from 'next/server';
// import { b } from 'bcrypt';
import bcrypt from 'bcryptjs';
import getDBConnection from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(request) {
    let db;
    try {
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Only admin members can create admin accounts' }, { status: 403 });
        }

        const { name, idNumber, password } = await request.json();

        // Validate input
        if (!name || !idNumber || !password) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate ID number format (assuming it should be a number)
        if (isNaN(idNumber)) {
            return NextResponse.json({ error: 'ID Number must be a valid number' }, { status: 400 });
        }

        db = await getDBConnection();

        // Check if user already exists
        const [existingUser] = await db.execute('SELECT * FROM users WHERE idNumber = ?', [idNumber]);
        if (existingUser.length > 0) {
            return NextResponse.json({ error: 'User with this ID already exists' }, { status: 400 });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password,10);

        // Insert the new admin user
        await db.execute(
            'INSERT INTO users (idNumber, name, password, role) VALUES (?, ?, ?, ?)',
            [idNumber, name, hashedPassword, 'admin']
        );

        return NextResponse.json({ 
            success: true, 
            message: 'Admin created successfully'
        });
    } catch (error) {
        console.error('Error creating admin:', error);
        return NextResponse.json({ 
            success: false,
            error: 'Internal server error' 
        }, { status: 500 });
    } finally {
        if (db) await db.end();
    }
}

export async function GET() {
    let db;
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
                error: 'Access denied. Only admin members can view admin list.' 
            }, { status: 403 });
        }

        db = await getDBConnection();
        if (!db) {
            throw new Error('Database connection failed');
        }

        const [rows] = await db.execute(
            `SELECT name, idNumber, role 
             FROM users 
             WHERE role = 'admin' 
             ORDER BY name ASC`
        );

        return NextResponse.json({
            success: true,
            admins: rows
        });
    } catch (error) {
        console.error('Error fetching admin list:', error);
        
        // Handle specific database errors
        if (error.code === 'ECONNREFUSED') {
            return NextResponse.json(
                { success: false, error: 'Database connection failed. Please try again later.' },
                { status: 503 }
            );
        }
        
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return NextResponse.json(
                { success: false, error: 'Database configuration error. Please contact support.' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'An unexpected error occurred while fetching admin list.' },
            { status: 500 }
        );
    } finally {
        if (db) {
            try {
                await db.end();
            } catch (error) {
                console.error('Error closing database connection:', error);
            }
        }
    }
} 