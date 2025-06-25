import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { cookies } from 'next/headers';
import * as ExcelJS from 'exceljs';

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
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Students');

    // Add headers
    if (processedData.length > 0) {
      const headers = Object.keys(processedData[0]);
      worksheet.addRow(headers);
      
      // Add data rows
      processedData.forEach(student => {
        const rowData = headers.map(header => student[header]);
        worksheet.addRow(rowData);
      });

      // Set column widths
      const columnWidths = [
        15,  // username
        30,  // name
        35,  // email
        15,  // phoneNumber
        20,  // selectedDomain
        12,  // mode
        8,   // slot
        15,  // studentLeadId
        15,  // facultyMentorId
        10,  // verified
        15,  // branch
        10,  // gender
        8,   // year
        15,  // residenceType
        20,  // hostelName
        20,  // busRoute
        15,  // country
        20,  // state
        20,  // district
        10,  // pincode
        20,  // createdAt
        20,  // updatedAt
        10,  // status
        30,  // studentLead
        30,  // facultyMentor
        10   // isCompleted
      ];

      // Apply column widths
      worksheet.columns.forEach((column, index) => {
        if (columnWidths[index]) {
          column.width = columnWidths[index];
        }
      });
    }

    // Generate buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();

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