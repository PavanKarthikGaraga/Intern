import pool from "../../../../../lib/db";
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function GET(request) {
    const connection = await pool.getConnection();
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
                error: 'Access denied. Only administrators can access this data.' 
            }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 30;
        const slot = searchParams.get('slot');
        const mode = searchParams.get('mode');
        const search = searchParams.get('search');

        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                s.*,
                r.name,
                r.mode as studentMode,
                r.slot as studentSlot
            FROM sstudents s
            JOIN registrations r ON s.username = r.username
            WHERE 1=1
        `;
        const queryParams = [];

        if (slot) {
            query += ' AND s.slot = ?';
            queryParams.push(slot);
        }

        if (mode) {
            query += ' AND s.mode = ?';
            queryParams.push(mode);
        }

        if (search) {
            query += ' AND (r.name LIKE ? OR s.username LIKE ?)';
            queryParams.push(`%${search}%`, `%${search}%`);
        }

        // Get total count
        const [countResult] = await connection.query(
            `SELECT COUNT(*) as total FROM (${query}) as subquery`,
            queryParams
        );
        const totalItems = countResult[0].total;
        const totalPages = Math.ceil(totalItems / limit);

        // Get paginated results
        query += ' ORDER BY s.username LIMIT ? OFFSET ?';
        queryParams.push(limit, offset);

        const [students] = await connection.query(query, queryParams);

        return NextResponse.json({
            success: true,
            data: {
                students,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems,
                    limit
                }
            }
        });

    } catch (error) {
        console.error('Error in supplyStudents GET:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Internal server error' 
            },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}

export async function DELETE(request) {
    const connection = await pool.getConnection();
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
                error: 'Access denied. Only administrators can delete supply students.' 
            }, { status: 403 });
        }

        const { username } = await request.json();

        if (!username) {
            return NextResponse.json(
                { success: false, error: 'Username is required' },
                { status: 400 }
            );
        }

        // Start transaction
        await connection.beginTransaction();

        try {
            // Get student info for stats update
            const [studentInfo] = await connection.query(
                'SELECT slot, mode FROM sstudents WHERE username = ?',
                [username]
            );

            if (studentInfo.length === 0) {
                await connection.rollback();
                return NextResponse.json(
                    { success: false, error: 'Student not found' },
                    { status: 404 }
                );
            }

            const student = studentInfo[0];

            // Delete from all s-tables (child tables first, then parent)
            const tables = [
                'suploads',
                'sstatus', 
                'sattendance',
                'smessages',
                'sdailyMarks',
                'sstudents'  // Delete from parent table last
            ];

            for (const table of tables) {
                await connection.query(`DELETE FROM ${table} WHERE username = ?`, [username]);
            }

            // Update stats table
            const modeColumn = student.mode.toLowerCase() === 'remote' ? 'Remote' : 'Incamp';
            const statsUpdateQuery = `
                UPDATE stats 
                SET slot${student.slot} = slot${student.slot} - 1,
                    slot${student.slot}${modeColumn} = slot${student.slot}${modeColumn} - 1,
                    ${student.mode.toLowerCase()} = ${student.mode.toLowerCase()} - 1,
                    totalStudents = totalStudents - 1
                WHERE id = 1;
            `;
            await connection.query(statsUpdateQuery);

            await connection.commit();

            return NextResponse.json({
                success: true,
                message: 'Supply student deleted successfully'
            });

        } catch (error) {
            await connection.rollback();
            throw error;
        }

    } catch (error) {
        console.error('Error in supplyStudents DELETE:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: 'Internal server error' 
            },
            { status: 500 }
        );
    } finally {
        connection.release();
    }
}