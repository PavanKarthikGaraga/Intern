import getDBConnection from '../../../../lib/db';
import { generateAuthTokens } from '../../../../lib/jwt';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

export async function POST(request) {
    let db;
    try {
        const { idNumber, password } = await request.json();

         db = await getDBConnection();

        // Query to find user by idNumber
        const [existingUser] = await db.query(
            'SELECT * FROM users WHERE idNumber = ?',
            [idNumber]
        );

        if (!existingUser || existingUser.length === 0) {
            return Response.json({
                error: 'ID Number does not exist'
            }, { status: 400 });
        }

        const user = existingUser[0]; // Get first user since idNumber should be unique
        
        const hashPassword = await bcrypt.compare(password, user.password);

        if (!hashPassword) {
            return Response.json({
                error: 'Invalid Password'
            }, { status: 400 });
        }
        
        const { accessToken, refreshToken } = generateAuthTokens({ 
            idNumber: user.idNumber,
            name:user.name,
            role: user.role 
        });
        
        // Get cookies instance
        const cookieStore = await cookies();
        
        // Set access token cookie
        await cookieStore.set('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 5 * 60 
        });

        // Set refresh token cookie
        await cookieStore.set('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 *60 
        });

        return Response.json({
            message: "User Successfully Logged In",
            user: {
                idNumber: user.idNumber,
                id: user.id,
                role: user.role 
            }
        }, { status: 200 });
        
    } catch (err) {
        return Response.json({
            error: err.message
        }, { status: 500 });
    } finally {
        await db.end();
    }
}