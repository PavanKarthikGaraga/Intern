import getDBConnection from "../lib/db.js";
import bcrypt from "bcryptjs";

async function insertUsers() {
  let db;
  try {
    db = await getDBConnection();

    const users = [
      // { idNumber: 1, name: "Mento", password: "pass12", role: "studentMentor" },
      { idNumber: 2, name: "Bob", password: "pass12", role: "faculty" },
      { idNumber: 3, name: "Admin", password: "pass21", role: "admin" },
    ];

    // Hash passwords
    const hashedUsers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 10),
      }))
    );

    // Insert users into the database
    for (const user of hashedUsers) {
      await db.execute(
        "INSERT INTO users (idNumber, name, password, role) VALUES (?, ?, ?, ?)",
        [user.idNumber, user.name, user.password, user.role]
      );
    }

    console.log("Users inserted successfully!");
  } catch (error) {
    console.error("Error inserting users:", error);
  } finally {
    if (db) await db.end(); // Close the connection
  }
}

insertUsers();
