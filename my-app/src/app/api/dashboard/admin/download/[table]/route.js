import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET(req, { params }) {
    try {
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ 
                success: false, 
                error: 'Authentication required. Please login again.' 
            }, { status: 402 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        if (decoded.username !== '2300032048') {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { table } = await params;
        const validTables = [
            'users',
            'studentLeads',
            'facultyMentors',
            'registrations',
            'uploads',
            'verify',
            'attendance',
            'final',
            'stats'
        ];

        if (!validTables.includes(table)) {
            return NextResponse.json(
                { success: false, error: 'Invalid table name' },
                { status: 400 }
            );
        }

        const connection = await pool.getConnection();
        try {
            const [rows] = await connection.query(`SELECT * FROM ${table}`);
            
            // Format timestamp fields
            const formattedRows = rows.map(row => {
                const formattedRow = { ...row };
                // Format createdAt and updatedAt fields if they exist
                if (formattedRow.createdAt) {
                    const date = new Date(formattedRow.createdAt);
                    formattedRow.createdAt = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
                }
                if (formattedRow.updatedAt) {
                    const date = new Date(formattedRow.updatedAt);
                    formattedRow.updatedAt = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
                }
                return formattedRow;
            });
            
            // Convert data to CSV format
            const headers = Object.keys(formattedRows[0] || {});
            const csvContent = [
                headers.join(','),
                ...formattedRows.map(row => 
                    headers.map(header => {
                        const value = row[header];
                        return typeof value === 'string' && value.includes(',') 
                            ? `"${value}"` 
                            : value;
                    }).join(',')
                )
            ].join('\n');

            // Create response with CSV content
            return new NextResponse(csvContent, {
                headers: {
                    'Content-Type': 'text/csv',
                    'Content-Disposition': `attachment; filename=${table}_data.csv`
                }
            });
        } finally {
            connection.release();
        }
    } catch (error) {
        console.error('Error in data download API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
} 