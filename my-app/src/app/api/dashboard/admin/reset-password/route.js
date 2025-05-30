import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { cookies } from 'next/headers';

// POST endpoint to reset passwords
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
                error: 'Access denied. Only admins can reset passwords.' 
            }, { status: 403 });
        }

        const { usernames } = await req.json();

        if (!Array.isArray(usernames) || usernames.length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'Invalid usernames' 
            }, { status: 400 });
        }

        // Validate username format (must start with 24 and be exactly 10 digits)
        const invalidUsernames = usernames.filter(username => 
            !/^24\d{8}$/.test(username)
        );

        if (invalidUsernames.length > 0) {
            return NextResponse.json({ 
                success: false, 
                error: `Invalid username format: ${invalidUsernames.join(', ')}. Usernames must start with 24 and be exactly 10 digits.` 
            }, { status: 400 });
        }

        // Format usernames for SQL query
        const formattedUsernames = usernames.map(username => `'${username}'`).join(',');

        // First check if all usernames exist and are students
        const checkQuery = `
            SELECT username, role 
            FROM users 
            WHERE username IN (${formattedUsernames})
        `;

        const [users] = await pool.query(checkQuery);

        // Check if all usernames exist
        if (users.length !== usernames.length) {
            const foundUsernames = users.map(user => user.username);
            const notFoundUsernames = usernames.filter(username => !foundUsernames.includes(username));
            return NextResponse.json({ 
                success: false, 
                error: `Users not found: ${notFoundUsernames.join(', ')}` 
            }, { status: 404 });
        }

        // Check if all users are students
        const nonStudentUsers = users.filter(user => user.role !== 'student');
        if (nonStudentUsers.length > 0) {
            return NextResponse.json({ 
                success: false, 
                error: `Cannot reset passwords for non-student users: ${nonStudentUsers.map(u => u.username).join(', ')}` 
            }, { status: 403 });
        }

        // Update passwords for valid student users
        const updateQuery = `
            UPDATE users 
            SET password = '$2a$10$.mlfuK/yGtw5X3zFk7tfcuSrZ5O/SqA2xeRr8KAoL0lvsDVffrx0e'
            WHERE username IN (${formattedUsernames})
            AND role = 'student'
        `;

        const [result] = await pool.query(updateQuery);

        return NextResponse.json({ 
            success: true, 
            message: `Successfully reset passwords for ${result.affectedRows} students` 
        });

    } catch (error) {
        console.error('Error resetting passwords:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to reset passwords' 
        }, { status: 500 });
    }
} 