import mysql2 from 'mysql2';

export const pool = mysql2.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 20,
    queueLimit: 0,
    multipleStatements: true,
}).promise();

pool.getConnection()
    .then( connection => {
        console.log(`Connected to MySQL database ${ process.env.DB_NAME } on thread ${ connection.threadId }`)
        connection.release();
    })
    .catch( error => {
        console.log(`Error connecting to MySQL database error: ${ error.message }`)
    });