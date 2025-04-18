import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function GET() {
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
                error: 'Access denied. Only admin members can view statistics.' 
            }, { status: 403 });
        }

        // Get stats from the stats table
        const [statsResult] = await pool.query('SELECT * FROM stats ORDER BY id DESC LIMIT 1');
        
        // If no stats found, return empty stats
        if (!statsResult || statsResult.length === 0) {
            return NextResponse.json({
                success: true,
                stats: {
                    overview: {
                        totalStudents: 0,
                        totalCompleted: 0,
                        totalActive: 0,
                        completionRate: "0.00"
                    },
                    slots: {
                        slot1: { total: 0, remote: 0, incampus: 0 },
                        slot2: { total: 0, remote: 0, incampus: 0 },
                        slot3: { total: 0, remote: 0, incampus: 0 },
                        slot4: { total: 0, remote: 0, incampus: 0 }
                    },
                    modes: {
                        remote: 0,
                        incampus: 0
                    },
                    domainStats: [],
                    modeStats: []
                }
            });
        }

        const stats = statsResult[0];

        // Get domain-wise statistics
        const [domainStats] = await pool.query(`
            SELECT 
                r.selectedDomain,
                COUNT(*) as total,
                SUM(CASE WHEN f.completed = true THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN f.completed = false OR f.completed IS NULL THEN 1 ELSE 0 END) as active
            FROM registrations r
            LEFT JOIN final f ON r.username = f.username
            GROUP BY r.selectedDomain
        `);

        // Get mode-wise statistics
        const [modeStats] = await pool.query(`
            SELECT 
                r.mode,
                COUNT(*) as total,
                SUM(CASE WHEN f.completed = true THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN f.completed = false OR f.completed IS NULL THEN 1 ELSE 0 END) as active
            FROM registrations r
            LEFT JOIN final f ON r.username = f.username
            GROUP BY r.mode
        `);

        return NextResponse.json({
            success: true,
            stats: {
                overview: {
                    totalStudents: stats.totalStudents,
                    totalCompleted: stats.totalCompleted,
                    totalActive: stats.totalActive,
                    completionRate: ((stats.totalCompleted / stats.totalStudents) * 100).toFixed(2)
                },
                slots: {
                    slot1: {
                        total: stats.slot1,
                        remote: stats.slot1Remote,
                        incampus: stats.slot1Incamp
                    },
                    slot2: {
                        total: stats.slot2,
                        remote: stats.slot2Remote,
                        incampus: stats.slot2Incamp
                    },
                    slot3: {
                        total: stats.slot3,
                        remote: stats.slot3Remote,
                        incampus: stats.slot3Incamp
                    },
                    slot4: {
                        total: stats.slot4,
                        remote: stats.slot4Remote,
                        incampus: stats.slot4Incamp
                    }
                },
                modes: {
                    remote: stats.remote,
                    incampus: stats.incampus
                },
                domainStats: domainStats || [],
                modeStats: modeStats || []
            }
        });

    } catch (error) {
        console.error('Error in admin stats endpoint:', error);
        return NextResponse.json({
            success: true,
            stats: {
                overview: {
                    totalStudents: 0,
                    totalCompleted: 0,
                    totalActive: 0,
                    completionRate: "0.00"
                },
                slots: {
                    slot1: { total: 0, remote: 0, incampus: 0 },
                    slot2: { total: 0, remote: 0, incampus: 0 },
                    slot3: { total: 0, remote: 0, incampus: 0 },
                    slot4: { total: 0, remote: 0, incampus: 0 }
                },
                modes: {
                    remote: 0,
                    incampus: 0
                },
                domainStats: [],
                modeStats: []
            }
        });
    }
} 