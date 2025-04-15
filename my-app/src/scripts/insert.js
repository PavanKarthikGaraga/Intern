import {pool} from "../config/db.js";
import bcrypt from "bcryptjs";

async function insertUsers() {
  try {
    const users = [
      { username: 2, name: "Bob", password: "pass12", role: "admin" },
      { username: 3, name: "Admin", password: "pass12", role: "admin" },
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
      await pool.query(
        "INSERT INTO users (username, name, password, role) VALUES (?, ?, ?, ?)",
        [user.username, user.name, user.password, user.role]
      );
    }

    console.log("Users inserted successfully!");
  } catch (error) {
    console.error("Error inserting users:", error);
  }
}

insertUsers();
