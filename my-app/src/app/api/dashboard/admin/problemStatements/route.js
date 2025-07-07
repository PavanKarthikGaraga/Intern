import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

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

        // Get query parameters for filtering and pagination
        const { searchParams } = new URL(req.url);
        const domain = searchParams.get('domain');
        const state = searchParams.get('state');
        const district = searchParams.get('district');
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const offset = (page - 1) * limit;

        // Build the WHERE clause based on filters
        let whereClause = '';
        const params = [];
        
        if (domain || state || district) {
            whereClause = 'WHERE ';
            const conditions = [];
            
            if (domain) {
                conditions.push('p.domain = ?');
                params.push(domain);
            }
            if (state) {
                conditions.push('p.state = ?');
                params.push(state);
            }
            if (district) {
                conditions.push('p.district = ?');
                params.push(district);
            }
            
            whereClause += conditions.join(' AND ');
        }

        // Get total count for pagination
        const [totalCount] = await pool.query(`
            SELECT COUNT(*) as total
            FROM problemStatements p
            ${whereClause}
        `, params);

        // Get paginated problem statements with student details
        const [problemStatements] = await pool.query(`
            SELECT 
                p.*,
                r.name as student_name,
                r.slot,
                r.mode
            FROM problemStatements p
            JOIN registrations r ON p.username = r.username
            ${whereClause}
            ORDER BY p.createdAt DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Get unique domains, states, and districts for filters
        const [domains] = await pool.query('SELECT DISTINCT domain FROM problemStatements');
        const [states] = await pool.query('SELECT DISTINCT state FROM problemStatements');
        const [districts] = await pool.query('SELECT DISTINCT district FROM problemStatements');

        // Get statistics
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(DISTINCT domain) as unique_domains,
                COUNT(DISTINCT state) as unique_states,
                COUNT(DISTINCT district) as unique_districts
            FROM problemStatements
        `);

        // Calculate pagination info
        const total = totalCount[0].total;
        const totalPages = Math.ceil(total / limit);
        const hasNextPage = page < totalPages;
        const hasPrevPage = page > 1;

        return NextResponse.json({
            success: true,
            data: {
                problemStatements,
                filters: {
                    domains: domains.map(d => d.domain),
                    states: states.map(s => s.state),
                    districts: districts.map(d => d.district)
                },
                stats: stats[0],
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limit,
                    hasNextPage,
                    hasPrevPage
                }
            }
        });

    } catch (error) {
        console.error('Error in problem statements API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
} 