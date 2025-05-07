import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        // Get faculty details
        const [facultyRows] = await pool.query(
            `SELECT fm.*, u.name as fullName
            FROM facultyMentors fm 
            JOIN users u ON fm.username = u.username 
            WHERE fm.username = ?`,
            [username]
        );

        if (facultyRows.length === 0) {
            return NextResponse.json({ error: 'Faculty mentor not found' }, { status: 404 });
        }

        const faculty = facultyRows[0];

        // Get assigned leads with their student counts
        const [leadRows] = await pool.query(
            `SELECT sl.*, u.name as fullName,
                    (SELECT COUNT(*) FROM registrations r WHERE r.studentLeadId = sl.username) as totalStudents,
                    (SELECT COUNT(*) FROM registrations r 
                     JOIN final f ON r.username = f.username 
                     WHERE r.studentLeadId = sl.username AND f.completed = true) as completedStudents
            FROM studentLeads sl
            JOIN users u ON sl.username = u.username
            WHERE sl.facultyMentorId = ?
            ORDER BY u.name ASC`,
            [username]
        );

        // Get assigned students with their status and marks
        const [studentRows] = await pool.query(
            `SELECT 
                r.*, 
                u.name as fullName, 
                f.completed, 
                f.finalReport,
                m.internalMarks,
                m.caseStudyReportMarks, 
                m.conductParticipationMarks, 
                m.totalMarks, 
                m.grade,
                a.day1, a.day2, a.day3, a.day4, a.day5, a.day6, a.day7,
                sl.name as leadName,
                sl.username as leadUsername
            FROM registrations r
            JOIN users u ON r.username = u.username
            LEFT JOIN final f ON r.username = f.username
            LEFT JOIN marks m ON r.username = m.username
            LEFT JOIN attendance a ON r.username = a.username
            LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
            WHERE r.facultyMentorId = ?
            ORDER BY u.name ASC`,
            [username]
        );

        // Calculate statistics
        const totalStudents = studentRows.length;
        const totalLeads = leadRows.length;
        const completedStudents = studentRows.filter(student => student.completed).length;
        const activeStudents = totalStudents - completedStudents;
        const completionRate = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0;

        // Format the response
        const response = {
            success: true,
            faculty: {
                username: faculty.username,
                name: faculty.name,
                email: faculty.email,
                phoneNumber: faculty.phoneNumber,
                branch: faculty.branch,
                stats: {
                    totalStudents,
                    totalLeads,
                    completedStudents,
                    activeStudents,
                    completionRate: Math.round(completionRate)
                },
                leads: leadRows.map(lead => ({
                    username: lead.username,
                    name: lead.name,
                    slot: lead.slot,
                    totalStudents: lead.totalStudents || 0,
                    completedStudents: lead.completedStudents || 0,
                    activeStudents: (lead.totalStudents || 0) - (lead.completedStudents || 0)
                })),
                students: studentRows.map(student => ({
                    username: student.username,
                    name: student.name,
                    selectedDomain: student.selectedDomain,
                    mode: student.mode,
                    completed: student.completed || false,
                    finalReport: student.finalReport,
                    leadName: student.leadName,
                    leadUsername: student.leadUsername,
                    attendance: {
                        day1: student.day1 || false,
                        day2: student.day2 || false,
                        day3: student.day3 || false,
                        day4: student.day4 || false,
                        day5: student.day5 || false,
                        day6: student.day6 || false,
                        day7: student.day7 || false
                    },
                    marks: student.totalMarks > 0 ? {
                        internal: student.internalMarks,
                        caseStudyReport: student.caseStudyReportMarks,
                        conductParticipation: student.conductParticipationMarks,
                        total: student.totalMarks,
                        grade: student.grade
                    } : null
                }))
            }
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error in faculty profile API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
} 