import getDBConnection from '@/lib/db';
import bcrypt from 'bcryptjs';
import { generateAuthTokens } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(request) {
    try {
        const { idNumber, password } = await request.json();

        const db = await getDBConnection(); // Create a new connection for this request

        const [rows] = await db.query(
            'SELECT * FROM users WHERE idNumber = ?',
            [idNumber]
        );

        if (rows.length === 0) {
            return new Response(JSON.stringify({
                error: 'idNumber does not exist'
            }), { status: 400 });
        }

        const user = rows[0];

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return new Response(JSON.stringify({
                error: 'Invalid Password'
            }), { status: 400 });
        }

        const { accessToken, refreshToken } = generateAuthTokens({
            idNumber: user.idNumber,
            role: user.role,
        });

        // Correct use of cookies() in serverless
        const cookieStore =await cookies();

        await cookieStore.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 // 15 seconds
        });

        await cookieStore.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 45 // 45 seconds
        });

        return new Response(JSON.stringify({
            message: "User Successfully Logged In",
            user: {
                username: user.name,
                id: user.idNumber.toString(),
                role: user.role
            }
        }), { status: 200 });

    } catch (err) {
        return new Response(JSON.stringify({
            error: err.message
        }), { status: 500 });
    }
}
