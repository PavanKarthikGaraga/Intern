import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
    let db;
    try {
        // Parse request body
        const { username, password } = await request.json();

        // Validate required fields
        if (!username || !password) {
            return NextResponse.json({
                success: false,
                error: 'Username and password are required'
            }, { 
                status: 400,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        // Get database connection
        db = await pool.getConnection();

        // Find user by username
        const [userRows] = await db.query(
            'SELECT username, name, password, role FROM users WHERE username = ?',
            [username]
        );

        if (!userRows || userRows.length === 0) {
            return NextResponse.json({
                success: false,
                error: 'Invalid credentials'
            }, { 
                status: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        const user = userRows[0];

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return NextResponse.json({
                success: false,
                error: 'Invalid credentials'
            }, { 
                status: 401,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });
        }

        // Prepare response data
        const responseData = {
            user: {
                username: user.username,
                name: user.name,
                role: user.role
            }
        };

        // Fetch problem statement data if exists
        const [problemStatementRows] = await db.query(
            'SELECT domain, problem_statement, location, district, state, createdAt, updatedAt FROM problemStatements WHERE username = ?',
            [username]
        );

        if (problemStatementRows && problemStatementRows.length > 0) {
            responseData.problemStatement = problemStatementRows[0];
        }

        // Fetch marks data if exists
        const [marksRows] = await db.query(
            'SELECT internalMarks, finalReport, finalPresentation, totalMarks, grade, feedback, completed, createdAt, updatedAt FROM marks WHERE username = ?',
            [username]
        );

        if (marksRows && marksRows.length > 0) {
            responseData.marks = marksRows[0];
        }

        // Fetch registration data if exists (for students)
        if (user.role === 'student') {
            const [registrationRows] = await db.query(
                `SELECT 
                    selectedDomain,
                    mode,
                    slot,
                    name,
                    email,
                    branch,
                    gender,
                    year,
                    phoneNumber,
                    residenceType,
                    hostelName,
                    busRoute,
                    country,
                    state,
                    district,
                    studentLeadId,
                    facultyMentorId,
                    pass,
                    createdAt
                FROM registrations WHERE username = ?`,
                [username]
            );

            if (registrationRows && registrationRows.length > 0) {
                responseData.registration = registrationRows[0];
            }
        }

        // Fetch faculty mentor data if role is facultyMentor
        if (user.role === 'facultyMentor') {
            const [facultyRows] = await db.query(
                `SELECT 
                    name,
                    phoneNumber,
                    email,
                    branch,
                    lead1Id,
                    lead2Id,
                    createdAt
                FROM facultyMentors WHERE username = ?`,
                [username]
            );

            if (facultyRows && facultyRows.length > 0) {
                responseData.facultyMentor = facultyRows[0];
            }
        }

        // Fetch student lead data if role is studentLead
        if (user.role === 'studentLead') {
            const [leadRows] = await db.query(
                `SELECT 
                    name,
                    phoneNumber,
                    email,
                    slot,
                    branch,
                    facultyMentorId,
                    createdAt
                FROM studentLeads WHERE username = ?`,
                [username]
            );

            if (leadRows && leadRows.length > 0) {
                responseData.studentLead = leadRows[0];
            }
        }

        return NextResponse.json({
            success: true,
            data: responseData
        }, {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });

    } catch (error) {
        console.error('Error in problem-statement-auth API:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error'
        }, { 
            status: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            }
        });
    } finally {
        if (db) {
            await db.release();
        }
    }
}

// Handle CORS preflight requests
export async function OPTIONS(request) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
