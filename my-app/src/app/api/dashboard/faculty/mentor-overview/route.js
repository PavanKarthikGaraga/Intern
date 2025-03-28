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
                    students: []
                };
            }

            // Get student details and their progress
            const [students] = await db.execute(`
                SELECT 
                    r.idNumber,
                    r.name,
                    (
                        SELECT COUNT(*)
                        FROM attendance a
                        WHERE a.idNumber = r.idNumber
                        AND (
                            a.day1 = 'P' OR a.day2 = 'P' OR a.day3 = 'P' OR a.day4 = 'P' OR
                            a.day5 = 'P' OR a.day6 = 'P' OR a.day7 = 'P' OR a.day8 = 'P'
                        )
                    ) as daysCompleted
                FROM registrations r
                WHERE r.idNumber IN (${studentIds.map(() => '?').join(',')})
            `, studentIds);

            return {
                mentorId: mentor.mentorId,
                name: mentor.name,
                domain: mentor.domain,
                students: students.map(student => ({
                    idNumber: student.idNumber,
                    name: student.name,
                    daysCompleted: student.daysCompleted || 0
                }))
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