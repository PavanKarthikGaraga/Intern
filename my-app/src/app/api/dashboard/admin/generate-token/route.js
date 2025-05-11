import { NextResponse } from 'next/server';
import { generateAuthTokens } from '@/lib/jwt';
import pool from '@/lib/db';
import { cookies } from 'next/headers';

export async function POST(request) {
  try {
    const { username } = await request.json();

    if (!username) {
      return NextResponse.json(
        { message: 'Username is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const [users] = await pool.query(
      'SELECT username, role,name FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    const user = users[0];

    // Generate tokens
    const { accessToken, refreshToken } = await generateAuthTokens({ 
        username: user.username,
        name: user.name,
        role: user.role 
    });

    // Get cookies instance
    const cookieStore = await cookies();

    // Set access token cookie
    await cookieStore.set('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 10 * 60 
    });

    // Set refresh token cookie
    await cookieStore.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 40 * 60 
    });

    return Response.json({
        message: "Token Generated Successfully",
        user: {
            username: user.username,
            id: user.id,
            role: user.role 
        }
    }, { status: 200 });

} catch (err) {
    return Response.json({
        error: err.message
    }, { status: 500 });
}
}