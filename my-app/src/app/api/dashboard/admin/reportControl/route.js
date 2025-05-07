import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyAccessToken } from "@/lib/jwt";
import { cookies } from 'next/headers';

// GET endpoint to fetch current report submission status
export async function GET(req) {
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
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only admins can view report control status.' 
            }, { status: 403 });
        }

        const [rows] = await pool.query("SELECT * FROM reportOpen WHERE id = 1");
        return NextResponse.json({ 
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error("Error fetching report control status:", error);
        return NextResponse.json({ 
            success: false,
            error: 'Internal Server Error' 
        }, { status: 500 });
    }
}

// PUT endpoint to update report submission status
export async function PUT(req) {
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
        if (!decoded || decoded.role !== 'admin') {
            return NextResponse.json({ 
                success: false, 
                error: 'Access denied. Only admins can update report control status.' 
            }, { status: 403 });
        }

        const { slot1, slot2, slot3, slot4 } = await req.json();

        await pool.query(
            "UPDATE reportOpen SET slot1 = ?, slot2 = ?, slot3 = ?, slot4 = ? WHERE id = 1",
            [slot1, slot2, slot3, slot4]
        );

        return NextResponse.json({ 
            success: true,
            message: 'Report submission status updated successfully'
        });
    } catch (error) {
        console.error("Error updating report control status:", error);
        return NextResponse.json({ 
            success: false,
            error: 'Internal Server Error' 
        }, { status: 500 });
    }
} 