const mysql = require('mysql2/promise');
require('dotenv').config(); // 使用 dotenv 讀取環境變數

/**
 * 創建資料庫連線池，從環境變數中讀取設定。
 * @type {mysql.Pool}
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  waitForConnections: process.env.DB_WAITFORCONNECTIONS === 'true',
  connectionLimit: parseInt(process.env.DB_CONNECTIONLIMIT, 10),
  queueLimit: parseInt(process.env.DB_QUEUE, 10),
});

/**
 * 測試與資料庫的連線，並嘗試查詢資料表中的資料。
 * 如果連線成功，則關閉連線池。
 * @async
 * @function testConnection
 * @returns {Promise<void>} - 連線成功或失敗後返回無具體值。
 * @throws {Error} - 如果連線或查詢發生錯誤，會記錄錯誤堆疊資訊。
 */
async function testConnection() {
  let conn;
  try {
    conn = await pool.getConnection();
    const [rows, errors] = await conn.query(
      'SELECT * FROM region_counters LIMIT 1'
    );
    conn.release();
    console.log('成功連線資料庫');
    await pool.end(); // 在連線成功建立後關閉連線池
  } catch (error) {
    console.log('連線資料庫失敗');
    console.log(error.stack);
    if (conn) {
      conn.release(); // 確保釋放資源
    }
  }
}

// testConnection();

module.exports = {
  pool,
};
