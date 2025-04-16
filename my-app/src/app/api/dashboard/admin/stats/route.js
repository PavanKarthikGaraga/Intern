import { NextResponse } from 'next/server';
import { pool } from '@/config/db';

export async function GET() {
    try {
        // Get total students
        const [totalStudents] = await pool.query(`
            SELECT COUNT(*) as total FROM registrations
        `);

        // Get active students
        const [activeStudents] = await pool.query(`
            SELECT COUNT(*) as total FROM registrations WHERE completed = FALSE
        `);

        // Get completed students
        const [completedStudents] = await pool.query(`
            SELECT COUNT(*) as total FROM registrations WHERE completed = TRUE
        `);

        // Get total domains
        const [totalDomains] = await pool.query(`
            SELECT COUNT(DISTINCT selectedDomain) as total FROM registrations
        `);

        // Get total mentors
        const [totalMentors] = await pool.query(`
            SELECT COUNT(*) as total FROM facultyMentors
        `);

        // Get domain-wise progress
        const [domainProgress] = await pool.query(`
            SELECT 
                selectedDomain as domain,
                COUNT(*) as total,
                SUM(CASE WHEN completed = FALSE THEN 1 ELSE 0 END) as active,
                SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as completed,
                COUNT(DISTINCT leadId) as mentors
            FROM registrations
            GROUP BY selectedDomain
        `);

        return NextResponse.json({
            success: true,
            stats: {
                totalStudents: totalStudents[0].total,
                activeStudents: activeStudents[0].total,
                completedStudents: completedStudents[0].total,
                totalDomains: totalDomains[0].total,
                totalMentors: totalMentors[0].total,
                completionRate: totalStudents[0].total > 0 
                    ? (completedStudents[0].total / totalStudents[0].total) * 100 
                    : 0
            },
            domainProgress
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch dashboard statistics' },
            { status: 500 }
        );
    }
} 