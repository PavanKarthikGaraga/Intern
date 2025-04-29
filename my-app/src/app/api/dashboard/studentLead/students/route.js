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

        // First get the current slot and student usernames from studentLeads
        const [leadData] = await db.query(
            'SELECT slot, student1Username, student2Username, student3Username, student4Username, student5Username, student6Username, student7Username, student8Username, student9Username, student10Username, student11Username, student12Username, student13Username, student14Username, student15Username, student16Username, student17Username, student18Username, student19Username, student20Username, student21Username, student22Username, student23Username, student24Username, student25Username, student26Username, student27Username, student28Username, student29Username, student30Username FROM studentLeads WHERE username = ?',
            [username]
        );

        if (!leadData.length) {
            return NextResponse.json(
                { success: false, error: 'Student lead not found' },
                { status: 404 }
            );
        }

        const currentSlot = leadData[0].slot;
        
        // Get all student usernames from the lead's record
        const studentUsernames = [];
        for (let i = 1; i <= 30; i++) {
            const username = leadData[0][`student${i}Username`];
            if (username) {
                studentUsernames.push(username);
            }
        }

        if (studentUsernames.length === 0) {
            return NextResponse.json({
                success: true,
                students: [],
                total: 0,
                currentSlot
            });
        }

        // Get students from registrations table whose usernames are in studentLeads
        const [students] = await db.query(
            `SELECT r.*, usr.name, usr.role
             FROM registrations r
             JOIN users usr ON r.username = usr.username
             WHERE r.username IN (?) AND r.slot = ?`,
            [studentUsernames, currentSlot]
        );

        // Get upload records for each student ordered by updatedAt
        const [uploads] = await db.query(
            `SELECT username, day1, day2, day3, day4, day5, day6, day7, updatedAt
             FROM uploads 
             WHERE username IN (?)
             ORDER BY updatedAt DESC`,
            [studentUsernames]
        );

        // Get verification records for each student
        const [verify] = await db.query(
            `SELECT username, day1, day2, day3, day4, day5, day6, day7
             FROM verify 
             WHERE username IN (?)`,
            [studentUsernames]
        );

        // Combine the data and maintain the order from uploads
        const studentsWithData = uploads.map(upload => {
            const student = students.find(s => s.username === upload.username);
            const studentVerify = verify.find(v => v.username === upload.username) || {};
            
            return {
                ...student,
                uploads: {
                    day1: upload.day1,
                    day2: upload.day2,
                    day3: upload.day3,
                    day4: upload.day4,
                    day5: upload.day5,
                    day6: upload.day6,
                    day7: upload.day7
                },
                verify: studentVerify
            };
        });

        return NextResponse.json({
            success: true,
            students: studentsWithData,
            total: students.length,
            currentSlot
        });
    } catch (error) {
        console.error('Error in get students API:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    } finally {
        if (db) await db.release();
    }
} 