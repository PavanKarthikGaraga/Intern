require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const mysql = require('mysql2/promise');

async function run() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    const ids = [
        '2500031918', '2500032333', '2500030720', '2500030676', '2500080085', '2500030893', '2500030928', '2500031933', '2500031794', '2500090264', '2500032048', '2500030711', '2500031776', '2500030888', '2500030987', '2500031182', '2500031780', '2500031784', '2500031155', '2500030121', '2500030149', '2500031613', '2500030309', '2500080173', '2500080260', '2500030389', '2500031747', '2500031897', '2500031138',
    ];
    for (let i = 0; i <= 566; i++) ids.push(String(2599990001 + i));
    ids.push('2500032469');

    const inClause = ids.map(id => `'${id}'`).join(', ');

    const queries = [
        "CREATE TABLE IF NOT EXISTS dailyTasks (id INT AUTO_INCREMENT PRIMARY KEY, username VARCHAR(255) NOT NULL, day TINYINT NOT NULL, data JSON NOT NULL, submittedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uq_user_day (username, day))",
        "CREATE TABLE IF NOT EXISTS unlockedDays (username VARCHAR(255) NOT NULL, day TINYINT NOT NULL, unlockedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (username, day))",
        `DELETE FROM suploads WHERE username IN (${inClause})`,
        `DELETE FROM sstatus WHERE username IN (${inClause})`,
        `DELETE FROM sattendance WHERE username IN (${inClause})`,
        `DELETE FROM smessages WHERE username IN (${inClause})`,
        `DELETE FROM sdailyMarks WHERE username IN (${inClause})`,
        `DELETE FROM sstudents WHERE username IN (${inClause})`,
        `DELETE FROM surveyResponses WHERE username IN (${inClause})`,
        `DELETE FROM problemStatements WHERE username IN (${inClause})`,
        `DELETE FROM certificates WHERE username IN (${inClause})`,
        `DELETE FROM messages WHERE username IN (${inClause})`,
        `DELETE FROM status WHERE username IN (${inClause})`,
        `DELETE FROM marks WHERE username IN (${inClause})`,
        `DELETE FROM dailyMarks WHERE username IN (${inClause})`,
        `DELETE FROM verify WHERE username IN (${inClause})`,
        `DELETE FROM attendance WHERE username IN (${inClause})`,
        `DELETE FROM uploads WHERE username IN (${inClause})`,
        `DELETE FROM final WHERE username IN (${inClause})`,
        `DELETE FROM dailyTasks WHERE username IN (${inClause})`,
        `DELETE FROM unlockedDays WHERE username IN (${inClause})`,
        `DELETE FROM activityLogs WHERE actorUsername IN (${inClause}) OR targetUsername IN (${inClause})`,
    ];

    for (let i = 1; i <= 30; i++) {
        queries.push(`UPDATE studentLeads SET student${i}Username = NULL WHERE student${i}Username IN (${inClause})`);
    }

    queries.push(`DELETE FROM registrations WHERE username IN (${inClause})`);
    queries.push(`DELETE FROM users WHERE username IN (${inClause})`);

    for (let q of queries) {
        try {
            const [result] = await connection.query(q);
            console.log(`Executed: ${q.substring(0, 50)}... Rows affected: ${result.affectedRows || 0}`);
        } catch (e) {
            console.error(`Error on query: ${q.substring(0, 50)}...`, e.message);
        }
    }
    
    await connection.end();
    console.log("Cleanup completely finished!");
}

run().catch(console.error);
