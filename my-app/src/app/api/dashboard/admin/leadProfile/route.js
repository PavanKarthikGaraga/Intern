import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const username = searchParams.get('username');

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        // Get lead details
        const [leadRows] = await pool.query(
            `SELECT sl.*, u.name as fullName
            FROM studentLeads sl 
            JOIN users u ON sl.username = u.username 
            WHERE sl.username = ?`,
            [username]
        );

        if (leadRows.length === 0) {
            return NextResponse.json({ error: 'Student lead not found' }, { status: 404 });
        }

        const lead = leadRows[0];

        // Get assigned students with their status and marks
        const [studentRows] = await pool.query(
            `SELECT 
                r.*, 
                u.name as fullName, 
                f.completed, 
                f.finalReport,
                m.attendanceMarks, 
                m.taskCompletionMarks, 
                m.problemIdentificationMarks,
                m.creativeWorkMarks, 
                m.finalReportMarks, 
                m.totalMarks, 
                m.grade,
                a.day1, a.day2, a.day3, a.day4, a.day5, a.day6, a.day7
            FROM registrations r
            JOIN users u ON r.username = u.username
            LEFT JOIN final f ON r.username = f.username
            LEFT JOIN marks m ON r.username = m.username
            LEFT JOIN attendance a ON r.username = a.username
            WHERE r.studentLeadId = ?
            ORDER BY u.name ASC`,
            [username]
        );

        // Calculate statistics
        const totalStudents = studentRows.length;
        const completedStudents = studentRows.filter(student => student.completed).length;
        const activeStudents = totalStudents - completedStudents;
        const completionRate = totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0;

        // Format the response
        const response = {
            success: true,
            lead: {
                username: lead.username,
                name: lead.name,
                email: lead.email,
                phoneNumber: lead.phoneNumber,
                slot: lead.slot,
                branch: lead.branch,
                stats: {
                    totalStudents,
                    completedStudents,
                    activeStudents,
                    completionRate: Math.round(completionRate)
                },
                students: studentRows.map(student => ({
                    username: student.username,
                    name: student.name,
                    selectedDomain: student.selectedDomain,
                    mode: student.mode,
                    completed: student.completed || false,
                    finalReport: student.finalReport,
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
                        attendance: student.attendanceMarks,
                        taskCompletion: student.taskCompletionMarks,
                        problemIdentification: student.problemIdentificationMarks,
                        creativeWork: student.creativeWorkMarks,
                        finalReport: student.finalReportMarks,
                        total: student.totalMarks,
                        grade: student.grade
                    } : null
                }))
            }
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('Error in lead profile API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
} 