import { NextResponse } from 'next/server';
import { pool } from '@/config/db';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const search = searchParams.get('search') || '';
        const offset = (page - 1) * limit;

        const [studentMentors] = await pool.query(`
            SELECT 
                r.id as studentId,
                r.name as studentName,
                r.username as studentUsername,
                r.selectedDomain as domain,
                sl.id as leadId,
                sl.name as leadName,
                sl.username as leadUsername,
                f.id as mentorId,
                f.name as mentorName,
                f.username as mentorUsername
            FROM registrations r
            LEFT JOIN studentLeads sl ON r.leadId = sl.username
            LEFT JOIN facultyStudentLeads fsl ON sl.id = fsl.studentLeadId
            LEFT JOIN facultyMentors f ON fsl.facultyMentorId = f.id
            WHERE r.name LIKE ? OR r.username LIKE ? OR sl.name LIKE ? OR sl.username LIKE ? OR f.name LIKE ? OR f.username LIKE ?
            ORDER BY r.id DESC
            LIMIT ? OFFSET ?
        `, [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, limit, offset]);

        const [total] = await pool.query(`
            SELECT COUNT(*) as total
            FROM registrations r
            LEFT JOIN studentLeads sl ON r.leadId = sl.username
            LEFT JOIN facultyStudentLeads fsl ON sl.id = fsl.studentLeadId
            LEFT JOIN facultyMentors f ON fsl.facultyMentorId = f.id
            WHERE r.name LIKE ? OR r.username LIKE ? OR sl.name LIKE ? OR sl.username LIKE ? OR f.name LIKE ? OR f.username LIKE ?
        `, [`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`]);

        return NextResponse.json({
            success: true,
            studentMentors,
            total: total[0].total
        });
    } catch (error) {
        console.error('Error fetching student-mentor relationships:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch student-mentor relationships' },
            { status: 500 }
        );
    }
}

export async function POST(request) {
    try {
        const { studentId, leadId } = await request.json();

        // Update student's lead
        await pool.query(
            'UPDATE registrations SET leadId = ? WHERE id = ?',
            [leadId, studentId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error assigning lead:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to assign lead' },
            { status: 500 }
        );
    }
}

export async function DELETE(request) {
    try {
        const { studentId } = await request.json();

        // Remove lead from student
        await pool.query(
            'UPDATE registrations SET leadId = NULL WHERE id = ?',
            [studentId]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error removing lead:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to remove lead' },
            { status: 500 }
        );
    }
} 