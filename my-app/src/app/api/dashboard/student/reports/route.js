import pool from "../../../../../lib/db";
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/jwt';
import { NextResponse } from 'next/server';

export async function POST(request) {
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
        if (!decoded || decoded.role !== 'student') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only students can submit reports.' 
            }, { status: 403 });
        }

        let db;
        try {
            db = await pool.getConnection();
            const { username, day, link } = await request.json();
            if(username !== decoded.username) {
                return new Response(
                    JSON.stringify({ success: false, error: "You cannot submit reports for other" }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }

            if (!username || !day || !link) {
                return new Response(
                    JSON.stringify({ success: false, error: "Missing required fields" }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }

            // Check if the student already has an entry
            const checkQuery = `SELECT username FROM uploads WHERE username = ?`;
            const [existing] = await db.execute(checkQuery, [username]);

            const dayColumn = `day${day}`;

            if (existing.length === 0) {
                // Create new record
                const insertQuery = `INSERT INTO uploads (username, ${dayColumn}) VALUES (?, ?)`;
                await db.execute(insertQuery, [username, link]);
            } else {
                // Update existing record
                const updateQuery = `UPDATE uploads SET ${dayColumn} = ? WHERE username = ?`;
                await db.execute(updateQuery, [link, username]);
            }

            return new Response(
                JSON.stringify({ success: true, message: "Report submitted successfully" }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );

        } catch (err) {
            console.error("Error submitting report", err);
            return new Response(
                JSON.stringify({ success: false, error: err.message }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        } finally {
            if (db) await db.release();
        }
    } catch (err) {
        console.error("Error in POST route", err);
        return NextResponse.json({ 
            success: false, 
            error: 'An error occurred. Please try again later.' 
        }, { status: 500 });
    }
}

// GET Route: Fetch all reports submitted by a student
export async function GET(request) {
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
        if (!decoded || decoded.role !== 'student') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only students can view reports.' 
            }, { status: 403 });
        }

        let db;
        try {
            db = await pool.getConnection();

            // Extract query parameters from the request URL
            const { searchParams } = new URL(request.url);
            const username = searchParams.get('username');

            if (!username) {
                return new Response(
                    JSON.stringify({ success: false, error: "Student username is required" }),
                    { status: 400, headers: { "Content-Type": "application/json" } }
                );
            }

            // First, get the uploads data
            const [uploads] = await db.execute(
                `SELECT * FROM uploads WHERE username = ?`,
                [username]
            );

            if (uploads.length === 0) {
                return new Response(
                    JSON.stringify({ 
                        success: true, 
                        data: [],
                        message: "No reports found"
                    }),
                    { status: 200, headers: { "Content-Type": "application/json" } }
                );
            }

            // Transform the data into the required format
            const reports = [];
            const upload = uploads[0];

            for (let day = 1; day <= 7; day++) {
                const dayColumn = `day${day}`;
                if (upload[dayColumn]) {
                    reports.push({
                        dayNumber: day,
                        link: upload[dayColumn],
                        createdAt: upload.createdAt
                    });
                }
            }

            return new Response(
                JSON.stringify({ 
                    success: true, 
                    data: reports,
                    message: "Reports fetched successfully"
                }),
                { status: 200, headers: { "Content-Type": "application/json" } }
            );

        } catch (err) {
            console.error("Error fetching reports:", err);
            return new Response(
                JSON.stringify({ success: false, error: err.message }),
                { status: 500, headers: { "Content-Type": "application/json" } }
            );
        } finally {
            if (db) await db.release();
        }
    } catch (err) {
        console.error("Error in GET route", err);
        return NextResponse.json({ 
            success: false, 
            error: 'An error occurred. Please try again later.' 
        }, { status: 500 });
    }
}
