import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';

export async function POST(request) {
    const cookieStore = await cookies();
    const accessToken = await cookieStore.get('accessToken');

    if (!accessToken?.value) {
        return NextResponse.json({ 
            success: false, 
            error: 'Authentication required. Please login again.' 
        }, { status: 401 });
    }

    const decoded = await verifyAccessToken(accessToken.value);
    if (!decoded || decoded.role !== 'student') {
        return NextResponse.json({ 
            success: false, 
            error: 'Access denied. Only students can submit reports.' 
        }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { username, domain, problem_statement, location, district, state } = body;
        if (!username || !domain || !problem_statement || !location || !district || !state) {
            return NextResponse.json({ success: false, error: 'All fields are required.' }, { status: 400 });
        }
        if (problem_statement.length > 50) {
            return NextResponse.json({ success: false, error: 'Problem statement must be 50 characters or less.' }, { status: 400 });
        }
        const db = await pool.getConnection();
        try {
            // Check eligibility: totalMarks >= 60
            const [marksRows] = await db.query('SELECT internalMarks, finalReport, finalPresentation FROM marks WHERE username = ?', [username]);
            const marks = marksRows[0];
            const totalMarks = Number(marks?.internalMarks || 0) + Number(marks?.finalReport || 0) + Number(marks?.finalPresentation || 0);
            if (totalMarks < 60) {
                return NextResponse.json({ success: false, error: 'You are not eligible to submit a problem statement (totalMarks < 60).' }, { status: 403 });
            }
            // Upsert: if already exists for this username, update, else insert
            const [existing] = await db.query('SELECT id FROM problemStatements WHERE username = ?', [username]);
            // console.log('Existing problem statement:', existing);
            if (existing.length > 0) {
                // console.log('Updating existing problem statement');
                await db.query(
                    'UPDATE problemStatements SET domain=?, problem_statement=?, location=?, district=?, state=?, updatedAt=NOW() WHERE username=?',
                    [domain, problem_statement, location, district, state, username]
                );
            } else {
                console.log('Inserting new problem statement');
                await db.query(
                    'INSERT INTO problemStatements (username, domain, problem_statement, location, district, state) VALUES (?, ?, ?, ?, ?, ?)',
                    [username, domain, problem_statement, location, district, state]
                );
            }
            return NextResponse.json({ success: true });
        } finally {
            db.release();
        }
    } catch (err) {
        console.error('Error submitting problem statement:', err);
        return NextResponse.json({ success: false, error: 'Server error.' }, { status: 500 });
    }
} 