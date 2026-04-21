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
                        slot1: { total: 0, remote: 0, incampus: 0, invillage: 0 },
                        slot2: { total: 0, remote: 0, incampus: 0, invillage: 0 },
                        slot3: { total: 0, remote: 0, incampus: 0, invillage: 0 },
                        slot4: { total: 0, remote: 0, incampus: 0, invillage: 0 },
                        slot5: { total: 0, remote: 0, incampus: 0, invillage: 0 },
                        slot6: { total: 0, remote: 0, incampus: 0, invillage: 0 },
                        slot7: { total: 0, remote: 0, incampus: 0, invillage: 0 },
                        slot8: { total: 0, remote: 0, incampus: 0, invillage: 0 },
                        slot9: { total: 0, remote: 0, incampus: 0, invillage: 0 }
                    },
                    modes: {
                        remote: 0,
                        incampus: 0,
                        invillage: 0
                    },
                    domainStats: [],
                    modeStats: []
                }
            });
        }

        const stats = statsResult[0];

        // Build slots object dynamically — only include slots whose columns exist in the stats row.
        // This makes the API safe for both the old DB (4 slots) and new DB (9 slots).
        const buildSlot = (n) => ({
            total: stats[`slot${n}`] ?? 0,
            remote: stats[`slot${n}Remote`] ?? 0,
            incampus: stats[`slot${n}Incamp`] ?? 0,
            invillage: stats[`slot${n}Invillage`] ?? 0
        });

        // Detect max slot number from columns present in the row
        const allPossibleSlots = [1,2,3,4,5,6,7,8,9];
        const availableSlots = allPossibleSlots.filter(n => stats[`slot${n}`] !== undefined);
        const slotsObj = {};
        availableSlots.forEach(n => { slotsObj[`slot${n}`] = buildSlot(n); });

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
                    totalStudents: stats.totalStudents ?? 0,
                    totalCompleted: stats.totalCompleted ?? 0,
                    totalActive: stats.totalActive ?? 0,
                    completionRate: stats.totalStudents
                        ? ((stats.totalCompleted / stats.totalStudents) * 100).toFixed(2)
                        : "0.00"
                },
                slots: slotsObj,
                availableSlots, // tell the frontend which slots to show
                modes: {
                    remote: stats.remote ?? 0,
                    incampus: stats.incampus ?? 0,
                    invillage: stats.invillage ?? 0
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
                    slot1: { total: 0, remote: 0, incampus: 0, invillage: 0 },
                    slot2: { total: 0, remote: 0, incampus: 0, invillage: 0 },
                    slot3: { total: 0, remote: 0, incampus: 0, invillage: 0 },
                    slot4: { total: 0, remote: 0, incampus: 0, invillage: 0 },
                    slot5: { total: 0, remote: 0, incampus: 0, invillage: 0 },
                    slot6: { total: 0, remote: 0, incampus: 0, invillage: 0 },
                    slot7: { total: 0, remote: 0, incampus: 0, invillage: 0 },
                    slot8: { total: 0, remote: 0, incampus: 0, invillage: 0 },
                    slot9: { total: 0, remote: 0, incampus: 0, invillage: 0 }
                },
                modes: {
                    remote: 0,
                    incampus: 0,
                    invillage: 0
                },
                domainStats: [],
                modeStats: []
            }
        });
    }
} 