const db = require('../db/db');
const bcrypt = require('bcrypt');

// 查詢使用者資料
async function findUserByUsername(username) {
  const [rows] = await db.pool.query('SELECT * FROM users WHERE username = ?', [username]);
  return rows[0];
}

// 新增使用者
async function createUser(username, password, role = 'user') {
  const hashedPassword = await bcrypt.hash(password, 10); // 將密碼進行加密
  await db.pool.query('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [username, hashedPassword, role]);
}

module.exports = {
  findUserByUsername,
  createUser
};
