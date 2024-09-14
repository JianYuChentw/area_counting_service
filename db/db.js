const mysql = require('mysql2/promise');
require('dotenv').config(); // 使用 dotenv 讀取環境變數

// 創建資料庫連線池，從環境變數中讀取設定
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: process.env.DB_WAITFORCONNECTIONS === 'true',
  connectionLimit: parseInt(process.env.DB_CONNECTIONLIMIT, 10),
  queueLimit: parseInt(process.env.DB_QUEUE, 10),
});

async function testConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows, errors] = await conn.query(
      'select * from region_counters limit 1'
    );
    conn.release();
    console.log('成功連線資料庫');
    await pool.end(); // 在連線成功建立後關閉連線
  } catch (error) {
    console.log('連線資料庫失敗');
    console.log(error.stack);
    if (conn) {
      conn.release(); // 確保釋放資源
    }
  }
}

testConnection()

// module.exports = {
//   pool,
// };
