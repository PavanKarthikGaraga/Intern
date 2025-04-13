import getDBConnection from '../../../../lib/db';
import { generateAuthTokens } from '../../../../lib/jwt';
import { sendEmail } from '../../../../lib/email';

export async function POST(request) {
    let db;
    try {
        const { email } = await request.json();
        
        db = await getDBConnection();

        // Find user by email
        const [users] = await db.query(
            'SELECT * FROM registrations WHERE email = ?',
            [email]
        );

        if (!users || users.length === 0) {
            // Return success even if email doesn't exist for security
            return Response.json({
                success: true,
                message: "If an account exists with this email, you will receive password reset instructions."
            });
        }

        const user = users[0];

        // Generate a temporary token for password reset
        const { accessToken } = await generateAuthTokens({
            idNumber: user.idNumber,
            type: 'password_reset'
        });

        // Create reset link
        const resetLink = `http://localhost:3000//auth/reset-password?token=${accessToken}`;

        // Send reset email
        await sendEmail(email, 'forgotPassword', resetLink);

        return Response.json({
            success: true,
            message: "If an account exists with this email, you will receive password reset instructions."
        });

    } catch (error) {
        console.error('Password reset request error:', error);
        return Response.json({
            success: false,
            error: "Failed to process password reset request"
        }, { status: 500 });
    } finally {
        if (db) await db.end();
    }
} 