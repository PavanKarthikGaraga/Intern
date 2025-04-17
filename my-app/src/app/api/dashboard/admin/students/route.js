import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(request) {
    let connection;
    try {
        // Validate admin session using JWT
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
                error: 'Access denied. Only admin members can view students.' 
            }, { status: 403 });
        }

        // Get query parameters
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 20;
        const domain = searchParams.get('domain');
        const slot = searchParams.get('slot');
        const mode = searchParams.get('mode');

        // Calculate offset
        const offset = (page - 1) * limit;

        // Build the query with filters
        let query = `
            SELECT 
                id, username, name, selectedDomain, mode, slot, 
                email, phoneNumber, completed, createdAt
            FROM registrations 
            WHERE 1=1
        `;
        let countQuery = 'SELECT COUNT(*) as total FROM registrations WHERE 1=1';
        const queryParams = [];

        if (domain) {
            query += ' AND selectedDomain = ?';
            countQuery += ' AND selectedDomain = ?';
            queryParams.push(domain);
        }

        if (slot) {
            query += ' AND slot = ?';
            countQuery += ' AND slot = ?';
            queryParams.push(parseInt(slot));
        }

        if (mode) {
            query += ' AND mode = ?';
            countQuery += ' AND mode = ?';
            queryParams.push(mode);
        }

        // Add pagination and ordering
        query += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';

        // Execute queries using the pool directly
        const [[students], [countResult]] = await Promise.all([
            pool.query(query, [...queryParams, limit, offset]),
            pool.query(countQuery, queryParams)
        ]);

        const totalStudents = countResult[0].total;
        const totalPages = Math.max(1, Math.ceil(totalStudents / limit));

        return NextResponse.json({
            success: true,
            data: {
                students,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalStudents,
                    limit
                }
            }
        });

    } catch (error) {
        console.error('Error in admin students endpoint:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error while fetching students'
        }, { status: 500 });
    }
}
