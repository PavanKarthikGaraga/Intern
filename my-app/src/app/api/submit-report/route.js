import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { day, link } = body;

    // Mock successful submission - replace with actual database calls
    return NextResponse.json({ 
      success: true, 
      message: `Report for day ${day} submitted successfully` 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
