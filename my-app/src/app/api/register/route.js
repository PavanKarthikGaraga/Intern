import getDBConnection from "../../../lib/db.js";
import bcrypt from 'bcryptjs';
import { sendEmail } from '../../../lib/email.js';

export async function POST(request) {
  let db;
  try {
        db = await getDBConnection(); // Get a new database connection
        const formData = await request.json();
        console.log(formData);

        // Start transaction
        await db.beginTransaction();

        try {
            const query1 = `
            INSERT INTO registrations 
            (selectedDomain, agreedToRules, name, idNumber, email, branch, gender, year, phoneNumber, 
            residenceType, hostelType, busRoute, country, state, district, pincode )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const query2 = `
            INSERT INTO users
            (name, idNumber, password, role)
            values(?,?,?,?)
            `;

            const values1 = [
                formData.selectedDomain,
                formData.agreedToRules,
                formData.studentInfo.name,
                formData.studentInfo.idNumber,
                formData.studentInfo.email,
                formData.studentInfo.branch,
                formData.studentInfo.gender,
                formData.studentInfo.year,
                formData.studentInfo.phoneNumber,
                formData.residence.type,
                formData.residence.hostelType,
                formData.residence.busRoute,
                formData.residence.country,
                formData.residence.state,
                formData.residence.district,
                formData.residence.pincode,
            ];

            const hashedPassword = await bcrypt.hash(`${formData.studentInfo.idNumber}${formData.studentInfo.phoneNumber.slice(-4)}`, 10);

            const values2 = [
                formData.studentInfo.name,
                formData.studentInfo.idNumber,
                hashedPassword,
                "student"
            ];

            // Insert student registration
            await db.execute(query1, values1);
            // Insert user record
            await db.execute(query2, values2);

            // Send welcome email
            const emailData = {
                name: formData.studentInfo.name,
                idNumber: formData.studentInfo.idNumber,
                selectedDomain: formData.selectedDomain,
                branch: formData.studentInfo.branch,
                year: formData.studentInfo.year
            };

            await sendEmail(formData.studentInfo.email, 'registration', emailData);

            // Find available mentor with same domain
            const [mentors] = await db.execute(`
                SELECT sm.*, 
                    (SELECT COUNT(*) FROM (
                        SELECT student1Id FROM studentMentors WHERE mentorId = sm.mentorId AND student1Id IS NOT NULL
                        UNION ALL
                        SELECT student2Id FROM studentMentors WHERE mentorId = sm.mentorId AND student2Id IS NOT NULL
                        UNION ALL
                        SELECT student3Id FROM studentMentors WHERE mentorId = sm.mentorId AND student3Id IS NOT NULL
                        UNION ALL
                        SELECT student4Id FROM studentMentors WHERE mentorId = sm.mentorId AND student4Id IS NOT NULL
                        UNION ALL
                        SELECT student5Id FROM studentMentors WHERE mentorId = sm.mentorId AND student5Id IS NOT NULL
                        UNION ALL
                        SELECT student6Id FROM studentMentors WHERE mentorId = sm.mentorId AND student6Id IS NOT NULL
                        UNION ALL
                        SELECT student7Id FROM studentMentors WHERE mentorId = sm.mentorId AND student7Id IS NOT NULL
                        UNION ALL
                        SELECT student8Id FROM studentMentors WHERE mentorId = sm.mentorId AND student8Id IS NOT NULL
                        UNION ALL
                        SELECT student9Id FROM studentMentors WHERE mentorId = sm.mentorId AND student9Id IS NOT NULL
                        UNION ALL
                        SELECT student10Id FROM studentMentors WHERE mentorId = sm.mentorId AND student10Id IS NOT NULL
                    ) as students) as assignedStudents
                FROM studentMentors sm
                WHERE sm.domain = ?
                HAVING assignedStudents < 10
                ORDER BY assignedStudents ASC
                LIMIT 1
            `, [formData.selectedDomain]);

            if (mentors.length > 0) {
                const mentor = mentors[0];
                let updateQuery = "UPDATE studentMentors SET ";
                let updateParams = [];
                let slotFound = false;

                // Find first available slot
                for (let i = 1; i <= 10; i++) {
                    const studentField = `student${i}Id`;
                    if (!mentor[studentField]) {
                        updateQuery += `${studentField} = ?`;
                        updateParams.push(formData.studentInfo.idNumber);
                        slotFound = true;
                        break;
                    }
                }

                if (slotFound) {
                    updateQuery += " WHERE mentorId = ?";
                    updateParams.push(mentor.mentorId);

                    // Update studentMentors table
                    await db.execute(updateQuery, updateParams);
                    
                    // Update registrations table
                    await db.execute(
                        'UPDATE registrations SET studentMentorId = ? WHERE idNumber = ?',
                        [mentor.mentorId, formData.studentInfo.idNumber]
                    );
                }
            }

            await db.commit();
            return new Response(JSON.stringify({success:true}), {
                status:201,
                headers:{"Content-Type":"application/json"},
            });
        } catch (error) {
            await db.rollback();
            throw error;
        }
    } catch (error) {
        console.error('Registration error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 500,
            headers: {"Content-Type":"application/json"},
        });
    } finally {
        if (db) {
            try {
                await db.end();
            } catch (error) {
                console.error('Error closing database connection:', error);
            }
        }
    }
}   