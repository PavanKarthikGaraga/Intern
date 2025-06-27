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

    const { query, page = 1, limit = 50, downloadAll = false } = await request.json();

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
      // Clean and normalize the query
      const cleanQuery = query.trim().replace(/;+$/, '');
      
      // Check if it's a SELECT query
      const isSelectQuery = cleanQuery.toLowerCase().startsWith('select');
      
      if (isSelectQuery) {
        // For SELECT queries, implement pagination unless downloadAll is true
        // Get total count for pagination
        const countQuery = `SELECT COUNT(*) as total FROM (${cleanQuery}) as count_table`;
        const [countResult] = await connection.query(countQuery);
        const total = countResult[0].total;

        let results;
        if (downloadAll) {
          // Fetch all results without LIMIT/OFFSET
          [results] = await connection.query(cleanQuery);
        } else {
        // Add LIMIT and OFFSET to the original query
          const offset = (page - 1) * limit;
        const paginatedQuery = `${cleanQuery} LIMIT ${limit} OFFSET ${offset}`;
          [results] = await connection.query(paginatedQuery);
        }
        await connection.commit();
        return NextResponse.json({
          message: 'Query executed successfully',
          results: results,
          pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
          }
        });
      } else {
        // For non-SELECT queries (INSERT, UPDATE, DELETE, etc.)
        const [result] = await connection.query(cleanQuery);
        await connection.commit();
        
        // Return appropriate message based on the query type
        let message = 'Query executed successfully';
        if (cleanQuery.toLowerCase().startsWith('insert')) {
          message = `Inserted ${result.affectedRows} row(s)`;
        } else if (cleanQuery.toLowerCase().startsWith('update')) {
          message = `Updated ${result.affectedRows} row(s)`;
        } else if (cleanQuery.toLowerCase().startsWith('delete')) {
          message = `Deleted ${result.affectedRows} row(s)`;
        }

        // console.log(result);
        
        return NextResponse.json({
          message: message,
          results: { affectedRows: result.affectedRows }
        });
      }
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