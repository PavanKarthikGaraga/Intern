import {pool} from "@/config/db";
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(request) {
    // let db;
    try {
        // Check authentication
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ error: 'Only admin members can access this resource' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const searchQuery = searchParams.get('search') || '';
        const leadId = searchParams.get('leadId');
        const page = parseInt(searchParams.get('page')) || 1;
        const limit = parseInt(searchParams.get('limit')) || 10;
        const offset = (page - 1) * limit;

        // db = await getDBConnection();

        // First verify if the lead exists if leadId is provided
        if (leadId) {
            const [leadCheck] = await pool.query(`
                SELECT id, username 
                FROM studentLeads 
                WHERE id = ?
            `, [leadId]);

            if (!leadCheck || leadCheck.length === 0) {
                return NextResponse.json({
                    success: false,
                    error: 'Student Lead not found'
                }, { status: 404 });
            }
        }

        let query = `
            SELECT 
                cs.studentDetails,
                cs.id,
                sl.username as leadUsername,
                sl.name as leadName
            FROM completedStudents cs
            LEFT JOIN studentLeads sl ON cs.id = sl.id
        `;

        const queryParams = [];

        if (leadId) {
            query += ' WHERE cs.id = ?';
            queryParams.push(leadId);
        }

        const [completedStudents] = await pool.query(query, queryParams);

        if (completedStudents.length === 0) {
            return NextResponse.json({
                success: true,
                completedStudents: [],
                total: 0,
                page,
                limit,
                totalPages: 0
            });
        }

        // Transform the JSON object into array format
        let allStudents = [];
        completedStudents.forEach(record => {
            const studentDetails = record.studentDetails;
            const students = Object.entries(studentDetails).map(([username, details]) => ({
                username,
                name: details.name,
                completionDate: details.completionDate,
                leadId: record.id,
                leadName: record.leadName,
                leadUsername: record.leadUsername,
                selectedDomain: details.domain
            }));
            allStudents = [...allStudents, ...students];
        });

        // Filter based on search query
        const filteredStudents = searchQuery 
            ? allStudents.filter(student => 
                student.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.selectedDomain?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            : allStudents;

        const total = filteredStudents.length;
        const paginatedStudents = filteredStudents.slice(offset, offset + limit);

        return NextResponse.json({
            success: true,
            completedStudents: paginatedStudents,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });

    } catch (error) {
        console.error('Error fetching completed students:', error);
        return NextResponse.json({ 
            success: false, 
            error: 'Failed to fetch completed students: ' + error.message 
        }, { status: 500 });
    }
}