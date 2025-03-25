import getDBConnection from "@/lib/db";

export async function GET(request) {
    let db;
    try {
        db = await getDBConnection();

        // Get total students
        const [totalStudentsResult] = await db.execute(
            "SELECT COUNT(*) as count FROM registrations"
        );
        const totalStudents = totalStudentsResult[0].count;

        // Get completed students (students who have completed all 8 days)
        const [completedStudentsResult] = await db.execute(`
            SELECT COUNT(DISTINCT r.idNumber) as count
            FROM registrations r
            JOIN attendance a ON r.idNumber = a.idNumber
            WHERE a.day1 = 'P' 
            AND a.day2 = 'P'
            AND a.day3 = 'P'
            AND a.day4 = 'P'
            AND a.day5 = 'P'
            AND a.day6 = 'P'
            AND a.day7 = 'P'
            AND a.day8 = 'P'
        `);
        const completedStudents = completedStudentsResult[0].count;

        // Get students by domain
        const [domainStatsResult] = await db.execute(`
            SELECT selectedDomain, COUNT(*) as count
            FROM registrations
            GROUP BY selectedDomain
        `);
        const domainStats = domainStatsResult.reduce((acc, row) => {
            acc[row.selectedDomain] = row.count;
            return acc;
        }, {});

        // Get students by faculty
        const [facultyStatsResult] = await db.execute(`
            SELECT u.name, COUNT(DISTINCT r.idNumber) as count
            FROM users u
            JOIN registrations r ON u.idNumber = r.idNumber
            WHERE u.role = 'faculty'
            GROUP BY u.name
        `);
        const facultyStats = facultyStatsResult.reduce((acc, row) => {
            acc[row.name] = row.count;
            return acc;
        }, {});

        return new Response(
            JSON.stringify({
                success: true,
                data: {
                    totalStudents,
                    completedStudents,
                    domainStats,
                    facultyStats
                }
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        );

    } catch (err) {
        console.error("Error fetching admin stats:", err);
        return new Response(
            JSON.stringify({ success: false, error: err.message }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    } finally {
        if (db) await db.end();
    }
} 