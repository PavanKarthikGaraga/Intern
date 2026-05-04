import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import { logActivity } from '@/lib/activityLog';

export async function PUT(request) {
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
        if (!decoded || decoded.role !== 'student') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only students can perform this action.' 
            }, { status: 403 });
        }

        const body = await request.json();
        const { 
            name, 
            gender, 
            branch, 
            email, 
            phoneNumber, 
            district, 
            state, 
            country, 
            pincode, 
            residenceType, 
            hostelName 
        } = body;

        const username = decoded.username;

        db = await pool.getConnection();

        // Check if already edited
        let checkRows = [];
        try {
            const [rows] = await db.execute('SELECT profileEdited FROM registrations WHERE username = ?', [username]);
            checkRows = rows;
        } catch (err) {
            // If the column doesn't exist yet, we will assume it's not edited
            if (err.code !== 'ER_BAD_FIELD_ERROR') throw err;
            checkRows = [{ profileEdited: 0 }];
        }

        if (checkRows.length === 0) {
            return NextResponse.json({ success: false, error: 'Student not found' }, { status: 404 });
        }

        if (checkRows[0].profileEdited) {
            return NextResponse.json({ success: false, error: 'You have already edited your profile once.' }, { status: 400 });
        }

        // Proceed to update
        await db.beginTransaction();

        try {
            // Ensure profileEdited column exists and gets updated
            await db.execute(`
                UPDATE registrations 
                SET name = ?, gender = ?, branch = ?, email = ?, phoneNumber = ?, 
                    district = ?, state = ?, country = ?, pincode = ?, 
                    residenceType = ?, hostelName = ?, profileEdited = TRUE
                WHERE username = ?
            `, [
                name, gender, branch, email, phoneNumber, 
                district, state, country, pincode, 
                residenceType, residenceType === 'Hostel' ? hostelName : 'N/A', 
                username
            ]);

            // Update the users table as well if name changed
            await db.execute('UPDATE users SET name = ? WHERE username = ?', [name, username]);

            await db.commit();

            logActivity({
                action: 'STUDENT_EDIT_PROFILE',
                actorUsername: username,
                actorName: name,
                actorRole: 'student',
                details: { editedFields: true }
            }).catch(() => {});

            return NextResponse.json({ success: true, message: 'Profile updated successfully' });

        } catch (error) {
            await db.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error in profile update API:', error);
        
        // Handle ER_BAD_FIELD_ERROR specifically for when the DB doesn't have the column yet
        if (error.code === 'ER_BAD_FIELD_ERROR' && error.message.includes('profileEdited')) {
             return NextResponse.json(
                { success: false, error: 'Database migration required. Please contact admin.' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    } finally {
        if (db) await db.release();
    }
}
