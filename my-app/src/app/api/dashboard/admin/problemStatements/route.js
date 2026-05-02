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

        const { searchParams } = new URL(req.url);
        const domain = searchParams.get('domain');
        const state = searchParams.get('state');
        const district = searchParams.get('district');
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const offset = (page - 1) * limit;

        // Build WHERE clause
        let whereClause = '';
        const params = [];
        if (domain || state || district) {
            whereClause = 'WHERE ';
            const conditions = [];
            if (domain)   { conditions.push('p.domain = ?');   params.push(domain); }
            if (state)    { conditions.push('p.state = ?');    params.push(state); }
            if (district) { conditions.push('p.district = ?'); params.push(district); }
            whereClause += conditions.join(' AND ');
        }

        // Total count (filtered)
        const [totalCount] = await pool.query(
            `SELECT COUNT(*) as total FROM problemStatements p ${whereClause}`, params
        );

        // Paginated table rows with student details
        const [problemStatements] = await pool.query(`
            SELECT p.*, r.name as student_name, r.slot, r.mode, r.batch
            FROM problemStatements p
            JOIN registrations r ON p.username = r.username
            ${whereClause}
            ORDER BY p.createdAt DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        // Filter option lists
        const [domains]   = await pool.query('SELECT DISTINCT domain FROM problemStatements ORDER BY domain');
        const [states]    = await pool.query('SELECT DISTINCT state FROM problemStatements ORDER BY state');
        const [districts] = await pool.query('SELECT DISTINCT district FROM problemStatements ORDER BY district');

        // Summary stats
        const [stats] = await pool.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(DISTINCT domain) as unique_domains,
                COUNT(DISTINCT state) as unique_states,
                COUNT(DISTINCT district) as unique_districts
            FROM problemStatements
        `);

        // Domain-wise analytics
        const [domainAnalytics] = await pool.query(`
            SELECT domain, COUNT(*) as count
            FROM problemStatements
            GROUP BY domain
            ORDER BY count DESC
        `);

        // Problem-statement-wise analytics (grouped under each domain)
        const [problemAnalytics] = await pool.query(`
            SELECT domain, problem_statement, COUNT(*) as count
            FROM problemStatements
            GROUP BY domain, problem_statement
            ORDER BY domain ASC, count DESC
        `);

        // Total registered students (to compute "not yet submitted" count)
        const [totalRegistered] = await pool.query(
            'SELECT COUNT(*) as total FROM registrations'
        );

        // List of students who have NOT submitted a problem statement
        const [notSubmittedList] = await pool.query(`
            SELECT r.username, r.name, r.slot, r.mode, r.selectedDomain, r.branch
            FROM registrations r
            LEFT JOIN problemStatements p ON r.username = p.username
            WHERE p.username IS NULL
            ORDER BY r.slot ASC, r.username ASC
        `);

        const total = totalCount[0].total;
        const totalPages = Math.ceil(total / limit);

        return NextResponse.json({
            success: true,
            data: {
                problemStatements,
                filters: {
                    domains:   domains.map(d => d.domain),
                    states:    states.map(s => s.state),
                    districts: districts.map(d => d.district)
                },
                stats: {
                    ...stats[0],
                    totalRegistered: totalRegistered[0].total,
                    notSubmitted: totalRegistered[0].total - stats[0].total
                },
                analytics: {
                    byDomain: domainAnalytics,
                    byProblemStatement: problemAnalytics
                },
                notSubmittedList,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: total,
                    itemsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
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