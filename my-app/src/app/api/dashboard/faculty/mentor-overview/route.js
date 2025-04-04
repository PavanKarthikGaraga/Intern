import { NextResponse } from 'next/server';
import getDBConnection from '@/lib/db';

export async function GET() {
    let db;
    try {
        db = await getDBConnection();
        
        // First, get all mentors
        const [mentors] = await db.execute(`
            SELECT 
                sm.mentorId,
                u.name,
                sm.domain,
                sm.student1Id, sm.student2Id, sm.student3Id, sm.student4Id, sm.student5Id,
                sm.student6Id, sm.student7Id, sm.student8Id, sm.student9Id, sm.student10Id
            FROM studentMentors sm
            JOIN users u ON sm.mentorId = u.idNumber
        `);
        
        // Process each mentor to get their students' details
        const mentorsWithStudents = await Promise.all(mentors.map(async (mentor) => {
            const studentIds = [
                mentor.student1Id, mentor.student2Id, mentor.student3Id, mentor.student4Id, mentor.student5Id,
                mentor.student6Id, mentor.student7Id, mentor.student8Id, mentor.student9Id, mentor.student10Id
            ].filter(id => id !== null);

            if (studentIds.length === 0) {
                return {
                    mentorId: mentor.mentorId,
                    name: mentor.name,
                    domain: mentor.domain,
                    students: [],
                    stats: {
                        total: 0,
                        active: 0,
                        completed: 0
                    }
                };
            }

            // Get student details and their progress
            const [students] = await db.execute(`
                SELECT 
                    r.idNumber,
                    r.name,
                    r.selectedDomain,
                    COALESCE(
                        (SELECT 
                            (CASE WHEN day1 = 'P' THEN 1 ELSE 0 END) +
                            (CASE WHEN day2 = 'P' THEN 1 ELSE 0 END) +
                            (CASE WHEN day3 = 'P' THEN 1 ELSE 0 END) +
                            (CASE WHEN day4 = 'P' THEN 1 ELSE 0 END) +
                            (CASE WHEN day5 = 'P' THEN 1 ELSE 0 END) +
                            (CASE WHEN day6 = 'P' THEN 1 ELSE 0 END) +
                            (CASE WHEN day7 = 'P' THEN 1 ELSE 0 END) +
                            (CASE WHEN day8 = 'P' THEN 1 ELSE 0 END)
                        FROM attendance a
                        WHERE a.idNumber = r.idNumber
                        ), 0
                    ) as daysCompleted
                FROM registrations r
                WHERE r.idNumber IN (${studentIds.map(() => '?').join(',')})
            `, studentIds);

            const processedStudents = students.map(student => ({
                idNumber: student.idNumber,
                name: student.name,
                selectedDomain: student.selectedDomain,
                daysCompleted: student.daysCompleted || 0
            }));

            // Calculate stats
            const stats = {
                total: processedStudents.length,
                active: processedStudents.filter(s => s.daysCompleted < 8).length,
                completed: processedStudents.filter(s => s.daysCompleted === 8).length
            };

            return {
                mentorId: mentor.mentorId,
                name: mentor.name,
                domain: mentor.domain,
                students: processedStudents,
                stats
            };
        }));

        return NextResponse.json({
            success: true,
            mentors: mentorsWithStudents
        });

    } catch (error) {
        console.error('Error fetching mentor overview:', error);
        return NextResponse.json(
            { error: 'Failed to fetch mentor overview' },
            { status: 500 }
        );
    } finally {
        if (db) await db.end();
    }
} 