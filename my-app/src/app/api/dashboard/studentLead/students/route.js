import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(req) {
    let db;
    try {
        const cookieStore = await cookies();
        const accessToken = await cookieStore.get('accessToken');

        if (!accessToken?.value) {
            return NextResponse.json({ 
                success: false, 
                error: 'Authentication required. Please login again.' 
            }, { status: 401 });
        }

        const decoded = await verifyAccessToken(accessToken.value);
        if (!decoded || decoded.role !== 'studentLead') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only student leads can access this data.' 
            }, { status: 403 });
        }
        let username = decoded.username;

        db = await pool.getConnection();

        // Get studentLead's slot first
        const [studentLead] = await db.query(
            "SELECT slot FROM studentLeads WHERE username = ?",
            [username]
        );

        if (!studentLead || studentLead.length === 0) {
            return NextResponse.json({ 
                success: false, 
                error: 'Student lead not found' 
            }, { status: 404 });
        }

        const currentSlot = studentLead[0].slot;

        // Get students directly from registrations table where studentLeadId matches
        const sql = `
            SELECT r.*, u.updatedAt
            FROM registrations r
            LEFT JOIN uploads u ON r.username = u.username
            WHERE r.studentLeadId = ?
            AND r.slot <= ?
            ORDER BY r.slot DESC, u.updatedAt DESC
        `;
          
        const [students] = await db.query(sql, [username, currentSlot]);

        // Get report open status
        const [reportOpen] = await db.query(
            "SELECT slot1, slot2, slot3, slot4 FROM reportOpen WHERE id = 1"
        );

        if (!students || students.length === 0) {
            return NextResponse.json({
                success: true,
                students: [],
                total: 0,
                reportOpen: reportOpen[0] || { slot1: false, slot2: false, slot3: false, slot4: false },
                message: 'No students assigned yet'
            });
        }

        // Get upload records for each student
        const [uploads] = await db.query(
            `SELECT username, day1, day2, day3, day4, day5, day6, day7, updatedAt
             FROM uploads 
             WHERE username IN (?)
             ORDER BY updatedAt DESC`,
            [students.map(s => s.username)]
        );

        // Get verification records for each student
        const [verify] = await db.query(
            `SELECT username, day1, day2, day3, day4, day5, day6, day7
             FROM verify 
             WHERE username IN (?)`,
            [students.map(s => s.username)]
        );

        // Combine the data
        const studentsWithData = students.map(student => {
            const upload = uploads.find(u => u.username === student.username) || {};
            const studentVerify = verify.find(v => v.username === student.username) || {};
            
            return {
                ...student,
                uploads: {
                    day1: upload.day1 || null,
                    day2: upload.day2 || null,
                    day3: upload.day3 || null,
                    day4: upload.day4 || null,
                    day5: upload.day5 || null,
                    day6: upload.day6 || null,
                    day7: upload.day7 || null
                },
                verify: studentVerify
            };
        });

        return NextResponse.json({
            success: true,
            students: studentsWithData,
            total: students.length,
            reportOpen: reportOpen[0] || { slot1: false, slot2: false, slot3: false, slot4: false },
            currentSlot: currentSlot
        });
    } catch (error) {
        console.error('Error in get students API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error', details: error.message },
            { status: 500 }
        );
    } finally {
        if (db) await db.release();
    }
} 