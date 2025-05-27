import bcrypt from 'bcryptjs';
import pool from './db'; // adjust path if needed

export async function genPass() {
  try {
    const [users] = await pool.query(
      "SELECT username FROM users WHERE role IN ('facultyMentor', 'studentLead')"
    );

    for (const user of users) {
      const rawPassword = `${user.username}@sac`;
      const hashedPassword = await bcrypt.hash(rawPassword, 10);

      await pool.query(
        'UPDATE users SET password = ? WHERE username = ?',
        [hashedPassword, user.username]
      );

      console.log(`✅ Password updated for: ${user.username}`);
    }

    console.log('🎉 All passwords updated successfully.');
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
  }
}


