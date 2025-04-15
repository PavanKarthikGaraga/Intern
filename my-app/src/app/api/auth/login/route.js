import { pool } from '../../../../config/db';
import { generateAuthTokens } from '../../../../lib/jwt';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const { username, password } = await request.json();

        // console.log("username",username);

        // Query to find user by username using the pool (connection pool)
        const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

        if (!rows || rows.length === 0) {
            return new Response(
                JSON.stringify({ error: 'ID Number does not exist' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const user = rows[0]; // Get the first user, as username is unique
        
        // Compare provided password with stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return new Response(
                JSON.stringify({ error: 'Invalid Password' }),
                { status: 400, headers: { 'Content-Type': 'application/json' } }
            );
        }

        // Generate auth tokens
        const { accessToken, refreshToken } = await generateAuthTokens({
            id: user.id,
            username:user.username,
            name: user.name,
            role: user.role
        });

        // Get cookies instance to set cookies
        const cookieStore = await cookies();

        // Set access token cookie
        await cookieStore.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 5 * 60 // 5 minutes
        });

        // Set refresh token cookie
        await cookieStore.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60 // 15 minutes
        });

        return new Response(
            JSON.stringify({
                message: 'User Successfully Logged In',
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role
                }
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
        );

    } catch (err) {
        console.error(err); // Log the error for debugging purposes
        return new Response(
            JSON.stringify({ error: err.message }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
