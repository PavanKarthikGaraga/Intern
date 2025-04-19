import pool from '../../../../lib/db';
import { generateAuthTokens } from '../../../../lib/jwt';
import { sendEmail } from '../../../../lib/email';

export async function POST(request) {
    let db;
    try {
        const { email } = await request.json();
        
        db = await pool.getConnection();

        // Find user by email
        const [users] = await db.query(
            `SELECT email FROM (
                SELECT email FROM registrations
                UNION
                SELECT email FROM facultyMentors
                UNION
                SELECT email FROM studentLeads
            ) AS allEmails
            WHERE email = ?`,
            [email]
          );
          

        if (!users || users.length === 0) {
            // Return success even if email doesn't exist for security
            return Response.json({
                success: true,
                message: "No Account found."
            });
        }

        const user = users[0];

        // Generate a temporary token for password reset
        const { accessToken } = await generateAuthTokens({
            username: user.username,
            type: 'password_reset'
        });

        // Create reset link
        const resetLink = `${process.env.APP_URL}/auth/reset-password?token=${accessToken}`;

        // Send reset email
        await sendEmail(email, 'forgotPassword', resetLink);

        return Response.json({
            success: true,
            message: "Mail sent"
        });

    } catch (error) {
        console.error('Password reset request error:', error);
        return Response.json({
            success: false,
            error: "Failed to process password reset request"
        }, { status: 500 });
    } finally {
        if (db) await db.release();
    }
} 