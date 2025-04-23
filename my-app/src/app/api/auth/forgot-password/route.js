import pool from '../../../../lib/db';
import { generateAuthTokens } from '../../../../lib/jwt';
import { sendEmail } from '../../../../lib/email';

export async function POST(request) {
    let db;
    try {
        const { email } = await request.json();
        
        db = await pool.getConnection();

        // Use a single query with UNION to check all tables at once
        const [users] = await db.query(
            `SELECT email, username FROM (
                SELECT email, username FROM registrations
                UNION
                SELECT email, username FROM facultyMentors
                UNION
                SELECT email, username FROM studentLeads
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

        // Send reset email asynchronously without waiting
        sendEmail(email, 'forgotPassword', resetLink)
            .catch(error => console.error('Email sending failed:', error));

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