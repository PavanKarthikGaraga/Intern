import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

export async function GET(req) {
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
        error: 'Access denied. Only admin members can access this data.' 
      }, { status: 403 });
    }

    // Verify that the user is an admin in database
    const userQuery = 'SELECT role FROM users WHERE username = ?';
    const [userRows] = await pool.query(userQuery, [decoded.username]);

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found in database' 
      }, { status: 404 });
    }

    const userRole = userRows[0].role;

    if (userRole !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: `User role is ${userRole}, but admin role is required` 
      }, { status: 403 });
    }

    // Get admin profile
    const [admin] = await pool.query(`
      SELECT 
        u.username,
        u.name,
        u.role
      FROM users u
      WHERE u.username = ?
    `, [decoded.username]);

    if (!admin || admin.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'Admin profile not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      profile: admin[0]
    });

  } catch (error) {
    console.error('Error in admin profile API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(req) {
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
        error: 'Access denied. Only admin members can access this data.' 
      }, { status: 403 });
    }

    // Verify that the user is an admin in database
    const userQuery = 'SELECT role FROM users WHERE username = ?';
    const [userRows] = await pool.query(userQuery, [decoded.username]);

    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found in database' 
      }, { status: 404 });
    }

    const userRole = userRows[0].role;

    if (userRole !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: `User role is ${userRole}, but admin role is required` 
      }, { status: 403 });
    }

    const { name, email, phoneNumber, currentPassword, newPassword } = await req.json();

    // Update profile
    if (name || email || phoneNumber) {
      const updateFields = [];
      const updateParams = [];

      if (name) {
        updateFields.push('name = ?');
        updateParams.push(name);
      }

      if (email) {
        updateFields.push('email = ?');
        updateParams.push(email);
      }

      if (phoneNumber) {
        updateFields.push('phoneNumber = ?');
        updateParams.push(phoneNumber);
      }

      updateParams.push(decoded.username);

      await pool.query(
        `UPDATE users SET ${updateFields.join(', ')} WHERE username = ?`,
        updateParams
      );
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      const [user] = await pool.query(
        'SELECT password FROM users WHERE username = ?',
        [decoded.username]
      );

      if (!user || user.length === 0) {
        return NextResponse.json({ 
          success: false, 
          error: 'User not found' 
        }, { status: 404 });
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user[0].password);
      if (!isPasswordValid) {
        return NextResponse.json({ 
          success: false, 
          error: 'Current password is incorrect' 
        }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.query(
        'UPDATE users SET password = ? WHERE username = ?',
        [hashedPassword, decoded.username]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Error in admin profile update API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 