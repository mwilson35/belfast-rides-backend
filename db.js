const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// Optional: try a connection test at startup
(async () => {
  try {
    const connection = await db.getConnection();
    console.log(`✅ Connected to MySQL database: ${process.env.DB_NAME}`);
    connection.release(); // release back to pool
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
  }
})();

module.exports = db;
