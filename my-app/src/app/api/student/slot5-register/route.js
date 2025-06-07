import { NextResponse } from 'next/server';
import { sql } from '@vercel/postgres';

export async function POST(request) {
  try {
    const { username, previousSlot, previousSlotMarks, mode } = await request.json();

    // Validate input
    if (!username || !previousSlot || !previousSlotMarks || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if student is already registered for slot 5
    const existingStudent = await sql`
      SELECT * FROM sstudents WHERE username = ${username}
    `;

    if (existingStudent.rows.length > 0) {
      return NextResponse.json(
        { error: 'Student is already registered for Slot 5' },
        { status: 400 }
      );
    }

    // Check if student exists in registrations
    const student = await sql`
      SELECT * FROM registrations WHERE username = ${username}
    `;

    if (student.rows.length === 0) {
      return NextResponse.json(
        { error: 'Student not found' },
        { status: 404 }
      );
    }

    // Insert into sstudents table
    await sql`
      INSERT INTO sstudents (username, mode, slot, previousSlot, previousSlotMarks)
      VALUES (${username}, ${mode}, 5, ${previousSlot}, ${previousSlotMarks})
    `;

    // Create entries in other s-tables
    await sql`
      INSERT INTO suploads (username) VALUES (${username})
    `;

    await sql`
      INSERT INTO sstatus (username) VALUES (${username})
    `;

    await sql`
      INSERT INTO sattendance (username) VALUES (${username})
    `;

    await sql`
      INSERT INTO smessages (username) VALUES (${username})
    `;

    await sql`
      INSERT INTO sdailyMarks (username) VALUES (${username})
    `;

    return NextResponse.json(
      { message: 'Successfully registered for Slot 5' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Slot 5 registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 