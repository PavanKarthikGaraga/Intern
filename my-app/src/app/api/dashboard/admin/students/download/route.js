import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import * as XLSX from 'xlsx';

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
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied. Only admin members can access this data.' 
      }, { status: 403 });
    }

    // Get all students data
    const query = `
      SELECT 
        r.username,
        r.name,
        r.email,
        r.phoneNumber,
        r.selectedDomain,
        r.mode,
        r.slot,
        r.studentLeadId,
        r.facultyMentorId,
        r.pass,
        r.branch,
        r.gender,
        r.year,
        r.residenceType,
        r.hostelName,
        r.busRoute,
        r.country,
        r.state,
        r.district,
        r.pincode,
        r.createdAt,
        r.updatedAt,
        CASE WHEN f.completed = 1 THEN 'Completed' ELSE 'Active' END as status,
        sl.name as studentLead,
        fm.name as facultyMentor,
        f.completed as isCompleted
      FROM registrations r
      LEFT JOIN final f ON r.username = f.username
      LEFT JOIN studentLeads sl ON r.studentLeadId = sl.username
      LEFT JOIN facultyMentors fm ON r.facultyMentorId = fm.username
      ORDER BY r.name ASC
    `;

    const [students] = await pool.query(query);

    // Process the data to format dates and boolean values
    const processedData = students.map(student => {
      const processed = { ...student };
      // Format dates
      if (processed.createdAt) {
        processed.createdAt = new Date(processed.createdAt).toLocaleString();
      }
      if (processed.updatedAt) {
        processed.updatedAt = new Date(processed.updatedAt).toLocaleString();
      }
      // Convert boolean values to Yes/No
      processed.isCompleted = processed.isCompleted ? 'Yes' : 'No';
      processed.verified = processed.verified ? 'Yes' : 'No';
      return processed;
    });

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(processedData);

    // Set column widths for all columns
    const columnWidths = [
      { wch: 15 },  // username
      { wch: 30 },  // name
      { wch: 35 },  // email
      { wch: 15 },  // phoneNumber
      { wch: 20 },  // selectedDomain
      { wch: 12 },  // mode
      { wch: 8 },   // slot
      { wch: 15 },  // studentLeadId
      { wch: 15 },  // facultyMentorId
      { wch: 10 },  // verified
      { wch: 15 },  // branch
      { wch: 10 },  // gender
      { wch: 8 },   // year
      { wch: 15 },  // residenceType
      { wch: 20 },  // hostelName
      { wch: 20 },  // busRoute
      { wch: 15 },  // country
      { wch: 20 },  // state
      { wch: 20 },  // district
      { wch: 10 },  // pincode
      { wch: 20 },  // createdAt
      { wch: 20 },  // updatedAt
      { wch: 10 },  // status
      { wch: 30 },  // studentLead
      { wch: 30 },  // facultyMentor
      { wch: 10 }   // isCompleted
    ];
    worksheet['!cols'] = columnWidths;

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Create response with appropriate headers
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=students.xlsx'
      }
    });

  } catch (error) {
    console.error('Error in download students API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 