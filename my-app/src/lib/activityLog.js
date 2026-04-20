import pool from './db.js';

export async function logActivity({ action, actorUsername, actorName, actorRole, targetUsername, details, ipAddress }) {
  try {
    await pool.query(
      `INSERT INTO activityLogs (action, actorUsername, actorName, actorRole, targetUsername, details, ipAddress) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        action,
        actorUsername || null,
        actorName || null,
        actorRole || null,
        targetUsername || null,
        typeof details === 'object' ? JSON.stringify(details) : details || null,
        ipAddress || null
      ]
    );
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
