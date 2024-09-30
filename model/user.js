const db = require('../db/db');
const bcrypt = require('bcrypt');

// 查詢使用者資料
async function findUserByUsername(username) {
  let conn;
  try {
    conn = await db.pool.getConnection(); // 獲取連接
    const [rows] = await conn.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0]; // 返回查詢結果
  } catch (error) {
    console.error('查詢使用者資料時發生錯誤:', error);
    throw error; // 將錯誤拋出
  } finally {
    if (conn) conn.release(); // 確保無論如何都釋放連接
  }
}

// 新增使用者
async function createUser(username, password, role = 'user') {
  let conn;
  try {
    const hashedPassword = await bcrypt.hash(password, 10); // 將密碼進行加密
    conn = await db.pool.getConnection(); // 獲取連接
    await conn.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role]);
  } catch (error) {
    console.error('新增使用者時發生錯誤:', error);
    throw error; // 將錯誤拋出
  } finally {
    if (conn) conn.release(); // 確保無論如何都釋放連接
  }
}

module.exports = {
  findUserByUsername,
  createUser
};
