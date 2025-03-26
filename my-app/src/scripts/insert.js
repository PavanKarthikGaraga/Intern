import getDBConnection from "../lib/db.js"; // Import database connection function
import bcrypt from "bcryptjs";

async function insertUsers() {
  let db;
  try {
    db = await getDBConnection(); // Get a new DB connection

    const users = [
      { idNumber: 1, name: "Mento", password: "pass", role: "studentMentor" },
      { idNumber: 2, name: "Bob", password: "pass", role: "faculty" },
      { idNumber: 3, name: "Admin", password: "pass", role: "admin" },
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
