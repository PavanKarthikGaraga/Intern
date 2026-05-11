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
        error: 'Authentication required. Please login again.',
      }, { status: 401 });
    }

    const decoded = await verifyAccessToken(accessToken.value);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({
        success: false,
        error: 'Access denied. Only admin members can access this data.',
      }, { status: 403 });
    }

    // ── Get filter params ──
    const { searchParams } = new URL(request.url);
    const domain          = searchParams.get('domain');
    const slot            = searchParams.get('slot');
    const mode            = searchParams.get('mode');
    const search          = searchParams.get('search');
    const gender          = searchParams.get('gender');
    const fieldOfInterest = searchParams.get('fieldOfInterest');
    const accommodation   = searchParams.get('accommodation');
    const transportation  = searchParams.get('transportation');
    const season          = searchParams.get('season') || '2026';
    const taskDay         = searchParams.get('taskDay');    // '1'–'7'
    const taskStatus      = searchParams.get('taskStatus'); // 'submitted' | 'not_submitted'

    let conditions = [];
    let params     = [];

    if (domain)          { conditions.push('r.selectedDomain = ?');  params.push(domain); }
    if (slot)            { conditions.push('r.slot = ?');             params.push(slot); }
    if (mode)            { conditions.push('r.mode = ?');             params.push(mode); }
    if (search) {
      conditions.push('(r.name LIKE ? OR r.email LIKE ? OR r.selectedDomain LIKE ? OR r.fieldOfInterest LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (gender)          { conditions.push('r.gender = ?');           params.push(gender); }
    if (fieldOfInterest) { conditions.push('r.fieldOfInterest = ?');  params.push(fieldOfInterest); }
    if (accommodation)   { conditions.push('r.accommodation = ?');    params.push(accommodation); }
    if (transportation)  { conditions.push('r.transportation = ?');   params.push(transportation); }
    if (season)          { conditions.push('r.season = ?');           params.push(season); }

    // ── Task day/status JOIN ──
    let taskJoin   = '';
    let taskParams = [];
    if (taskDay && taskStatus === 'submitted') {
      taskJoin = 'INNER JOIN dailyTasks dt ON r.username = dt.username AND dt.day = ?';
      taskParams.push(taskDay);
    } else if (taskDay && taskStatus === 'not_submitted') {
      taskJoin = 'LEFT JOIN dailyTasks dt ON r.username = dt.username AND dt.day = ?';
      taskParams.push(taskDay);
      conditions.push('dt.username IS NULL');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const allParams   = [...taskParams, ...params];

    const query = `
      SELECT
        r.username,
        r.name,
        r.email,
        r.phoneNumber,
        r.selectedDomain,
        r.mode,
        r.slot,
        r.branch,
        r.gender,
        r.year,
        r.residenceType,
        r.hostelName,
        r.busRoute,
        r.accommodation,
        r.transportation,
        r.country,
        r.state,
        r.district,
        r.pincode,
        r.fieldOfInterest,
        r.studentLeadId,
        r.facultyMentorId,
        sl.name  AS studentLead,
        fm.name  AS facultyMentor,
        CASE WHEN f.completed = 1 THEN 'Completed' ELSE 'Active' END AS status,
        r.createdAt,
        r.updatedAt
      FROM registrations r
      ${taskJoin}
      LEFT JOIN final f           ON r.username = f.username
      LEFT JOIN studentLeads sl   ON r.studentLeadId   = sl.username
      LEFT JOIN facultyMentors fm ON r.facultyMentorId = fm.username
      ${whereClause}
      ORDER BY r.slot ASC, r.name ASC
    `;

    const [students] = await pool.query(query, allParams);

    // ── Column definitions: DB key → UPPERCASE header → column width ──
    const COLUMN_CONFIG = [
      { key: 'username',        header: 'STUDENT ID',           width: 16 },
      { key: 'name',            header: 'FULL NAME',             width: 30 },
      { key: 'email',           header: 'EMAIL',                 width: 35 },
      { key: 'phoneNumber',     header: 'PHONE NUMBER',          width: 16 },
      { key: 'selectedDomain',  header: 'DOMAIN',                width: 22 },
      { key: 'mode',            header: 'MODE',                  width: 14 },
      { key: 'slot',            header: 'SLOT',                  width: 8  },
      { key: 'branch',          header: 'BRANCH',                width: 18 },
      { key: 'gender',          header: 'GENDER',                width: 10 },
      { key: 'year',            header: 'YEAR',                  width: 8  },
      { key: 'residenceType',   header: 'RESIDENCE TYPE',        width: 16 },
      { key: 'hostelName',      header: 'HOSTEL NAME',           width: 20 },
      { key: 'busRoute',        header: 'BUS ROUTE',             width: 20 },
      { key: 'accommodation',   header: 'ACCOMMODATION',         width: 16 },
      { key: 'transportation',  header: 'TRANSPORTATION',        width: 16 },
      { key: 'country',         header: 'COUNTRY',               width: 14 },
      { key: 'state',           header: 'STATE',                 width: 18 },
      { key: 'district',        header: 'DISTRICT',              width: 18 },
      { key: 'pincode',         header: 'PINCODE',               width: 10 },
      { key: 'fieldOfInterest', header: 'FIELD OF INTEREST',     width: 28 },
      { key: 'studentLeadId',   header: 'STUDENT LEAD ID',       width: 16 },
      { key: 'facultyMentorId', header: 'FACULTY MENTOR ID',     width: 18 },
      { key: 'studentLead',     header: 'STUDENT LEAD NAME',     width: 28 },
      { key: 'facultyMentor',   header: 'FACULTY MENTOR NAME',   width: 28 },
      { key: 'status',          header: 'STATUS',                width: 12 },
      { key: 'createdAt',       header: 'REGISTERED ON (IST)',   width: 24 },
      { key: 'updatedAt',       header: 'LAST UPDATED (IST)',    width: 24 },
    ];

    // ── Build workbook ──
    const workbook       = new ExcelJS.Workbook();
    workbook.creator     = 'KL Social Internship Admin';
    workbook.created     = new Date();

    const worksheet = workbook.addWorksheet('Students', {
      views: [{ state: 'frozen', ySplit: 1 }], // freeze header row while scrolling
    });

    // Define columns (key + width; header added separately for styling)
    worksheet.columns = COLUMN_CONFIG.map(col => ({
      key:   col.key,
      width: col.width,
    }));

    // ── Add & style header row ──
    const headerRow = worksheet.addRow(COLUMN_CONFIG.map(col => col.header));
    headerRow.height = 22;
    headerRow.eachCell(cell => {
      cell.font = {
        bold:  true,
        size:  11,
        color: { argb: 'FF000000' }, // black text
      };
      cell.fill = {
        type:    'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFD700' }, // gold / yellow
      };
      cell.alignment = {
        horizontal: 'center',
        vertical:   'middle',
      };
      cell.border = {
        bottom: { style: 'medium', color: { argb: 'FFCCAA00' } },
      };
    });

    // ── Add data rows ──
    students.forEach(student => {
      const rowValues = COLUMN_CONFIG.map(col => {
        const val = student[col.key];
        if ((col.key === 'createdAt' || col.key === 'updatedAt') && val) {
          return new Date(val).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        }
        return val ?? '';
      });
      const dataRow = worksheet.addRow(rowValues);
      dataRow.eachCell(cell => {
        cell.alignment = { vertical: 'middle' };
      });
    });

    // ── Build descriptive filename ──
    // e.g.  students_slot1_remote_day2_not_submitted_2026-05-11.xlsx
    const today  = new Date().toISOString().slice(0, 10);
    const parts  = ['students'];
    if (slot)       parts.push(`slot${slot}`);
    if (mode)       parts.push(mode.toLowerCase());
    if (taskDay)    parts.push(`day${taskDay}`);
    if (taskStatus) parts.push(taskStatus);                                      // 'submitted' | 'not_submitted'
    if (domain)     parts.push(domain.replace(/\s+/g, '_').toLowerCase());
    parts.push(today);
    const filename = parts.join('_') + '.xlsx';

    // ── Stream response ──
    const excelBuffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error in download students API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}