import mysql from 'mysql2/promise';

async function test() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'intern_platform'
  });
  
  try {
    const dataDraft = { isFinal: false, test: 1 };
    const dataFinal = { isFinal: true, test: 2 };
    
    // insert draft
    await db.execute(`
      INSERT INTO dailyTasks (username, day, data)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE data = VALUES(data)
    `, ['testuser', 99, JSON.stringify(dataDraft)]);
    
    // get submittedAt
    const [rows1] = await db.execute('SELECT submittedAt FROM dailyTasks WHERE username=? AND day=?', ['testuser', 99]);
    console.log('Draft submittedAt:', rows1[0].submittedAt);
    
    await new Promise(r => setTimeout(r, 2000));
    
    // update to final
    await db.execute(`
      INSERT INTO dailyTasks (username, day, data)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        submittedAt = IF(JSON_EXTRACT(VALUES(data), '$.isFinal') = true AND IFNULL(JSON_EXTRACT(dailyTasks.data, '$.isFinal'), false) != true, CURRENT_TIMESTAMP, dailyTasks.submittedAt),
        data = VALUES(data),
        updatedAt = CURRENT_TIMESTAMP
    `, ['testuser', 99, JSON.stringify(dataFinal)]);
    
    // get submittedAt
    const [rows2] = await db.execute('SELECT submittedAt FROM dailyTasks WHERE username=? AND day=?', ['testuser', 99]);
    console.log('Final submittedAt:', rows2[0].submittedAt);
    
  } catch (e) {
    console.log(e);
  } finally {
    await db.execute('DELETE FROM dailyTasks WHERE username=? AND day=?', ['testuser', 99]);
    db.end();
  }
}
test();
