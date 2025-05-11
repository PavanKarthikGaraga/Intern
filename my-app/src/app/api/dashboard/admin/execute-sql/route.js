import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

export async function POST(request) {
  let connection;
  try {
    // Get the token from cookies
    const cookieStore = await cookies();
    const token = await cookieStore.get('accessToken')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify the token and get user info
    const payload = await verifyAccessToken(token);
    
    // Check if the user is the specific admin
    if (payload.username !== '2300032048') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { query } = await request.json();

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Get a connection from the pool
    connection = await pool.getConnection();

    // Start a transaction
    await connection.beginTransaction();

    try {
      // Execute the query
      await connection.query(query);
      
      // Commit the transaction
      await connection.commit();

      return NextResponse.json({
        message: 'Query executed successfully'
      });
    } catch (error) {
      // Rollback the transaction in case of error
      await connection.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Error executing SQL query:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  } finally {
    // Release the connection back to the pool
    if (connection) {
      connection.release();
    }
  }
} 