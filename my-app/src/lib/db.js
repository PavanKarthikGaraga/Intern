import mysql from "mysql2/promise";
import { cookies } from 'next/headers';

// Create the default pool (Social_2026)
const defaultPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
});

// Create the legacy pool (Social)
const legacyPool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.OLD_DB_NAME,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
});

/**
 * Proxy object that intercepts calls to 'pool' and directs them to the correct database.
 * It checks the 'use_legacy_db' cookie to determine which pool to use.
 */
const poolProxy = new Proxy({}, {
  get(target, prop) {
    const getActivePool = async () => {
      try {
        // cookies() is only available in Next.js Server Components/Routes
        const cookieStore = await cookies();
        const useLegacy = cookieStore.get('use_legacy_db')?.value === 'true';
        return useLegacy ? legacyPool : defaultPool;
      } catch (e) {
        // Fallback for CLI scripts (init-db.js, etc.) or outside of request context
        return defaultPool;
      }
    };

    // Return a wrapper function that awaits the active pool before executing the command
    return async (...args) => {
      const activePool = await getActivePool();
      if (typeof activePool[prop] === 'function') {
        return activePool[prop](...args);
      }
      return activePool[prop];
    };
  }
});

export { defaultPool, legacyPool };
export default poolProxy;
