import { stat } from "fs";
import getDBConnection from "../../../lib/db.js";
import bcrypt from 'bcryptjs';


export async function POST(request) {
  let db;
  try {
        db = await getDBConnection(); // Get a new database connection
        const formData = await request.json();
        console.log(formData);

        const query1 = `
        INSERT INTO registrations 
        (selectedDomain, agreedToRules, name, idNumber, email, branch, gender, year, phoneNumber, 
        residenceType, hostelType, busRoute, country, state, district, pincode )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const query2=`
        
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

        const values2=[
        formData.studentInfo.name,
        formData.studentInfo.idNumber,
        hashedPassword,
        "user"
        ];
        const result1 = await db.execute(query1, values1);
        const result2 = await db.execute(query2, values2);
        
        return new Response(JSON.stringify({success:true}), {
            status:201,
            headers:{"Content-Type":"application/json"},
        });
    } catch(err) {
        console.log("Error Registering", { error: err.message });
        return new Response(JSON.stringify({success:false, error: err.message}), {
            status:500,
            headers:{"Content-Type":"application/json"},
        });
    } finally {
        if (db) await db.end();
    }
}   