import pool from "../lib/db.js";
import bcrypt from "bcryptjs";

async function insertUsers() {
  let db;
  try {
    db = await pool.getConnection();

    const users = [
      { username: "2", name: "admin", password: "pass12", role: "admin" },
      { username: "2300032048", name: "karthik", password: "pass12", role: "admin" },
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
        "INSERT INTO users (username, name, password, role) VALUES (?, ?, ?, ?)",
        [user.username, user.name, user.password, user.role]
      );
    }

    console.log("Users inserted successfully!");
  } catch (error) {
    console.error("Error inserting users:", error);
  } finally {
    if (db) await db.release(); // Close the connection
  }
}

insertUsers();
