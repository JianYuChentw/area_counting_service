const db = require('../db/db');

/**
 * 根據指定的日期查詢區域計數器的資料，並包含計數器的值、最大值和狀態。
 * @async
 * @param {string} date - 要查詢的日期，格式為 YYYY-MM-DD。
 * @returns {Promise<Object[]>} - 返回包含區域計數器資料的數組，每個對象包含區域名稱、計數器時間、日期、計數器值、最大計數器值和狀態。
 * @throws {Error} - 如果查詢過程中發生錯誤，將在控制台記錄錯誤。
 */
async function getRegionCountersByDate(date) {
  let conn;
  try {
    conn = await db.pool.getConnection();
    
    // 查詢指定日期的所有區域資料，並同時取得 max_counter_value 和 state
    const query = `
      SELECT rc.id, r.area, DATE_FORMAT(rc.counter_time, '%H:%i') as counter_time, 
             DATE_FORMAT(rc.date, '%Y/%m/%d') as date, rc.counter_value, rc.max_counter_value, rc.state
      FROM region_counters rc
      JOIN regions r ON rc.region_id = r.id
      WHERE DATE(rc.date) = ?
      ORDER BY rc.counter_time;
    `;

    // 使用 prepared statement，避免 SQL 注入
    const [rows] = await conn.query(query, [date]);

    return rows;
    
  } catch (error) {
    console.error('查詢時發生錯誤:', error);
  } finally {
    if (conn) conn.release(); // 釋放連線
  }
}

/**
 * 新增區域名稱到 regions 表。
 * @async
 * @function addRegion
 * @param {string} area - 區域的名稱。
 * @returns {Promise<Object>} - 返回新增的區域資料（ID 和名稱）。
 * @throws {Error} - 如果新增過程中發生錯誤，拋出錯誤。
 */
async function addRegion(area) {
  let conn;
  try {
    conn = await db.pool.getConnection();
    const query = `
      INSERT INTO regions (area)
      VALUES (?);
    `;
    const [result] = await conn.query(query, [area]);
    conn.release();
    return {
      id: result.insertId,
      area,
    };
  } catch (error) {
    console.error('新增區域時發生錯誤:', error);
    if (conn) conn.release();
    throw error;
  }
}


/**
 * 刪除指定區域 ID 的資料。
 * @async
 * @function deleteRegion
 * @param {number} id - 區域的 ID。
 * @returns {Promise<boolean>} - 成功刪除時返回 true，否則返回 false。
 * @throws {Error} - 如果刪除過程中發生錯誤，拋出錯誤。
 */
async function deleteRegion(id) {
  let conn;
  try {
    conn = await db.pool.getConnection();
    const query = `DELETE FROM regions WHERE id = ?;`;
    const [result] = await conn.query(query, [id]);
    conn.release();
    return result.affectedRows > 0; // 如果有刪除的行數，表示刪除成功
  } catch (error) {
    console.error('刪除區域時發生錯誤:', error);
    if (conn) conn.release();
    throw error;
  }
}


/**
 * 編輯指定區域 ID 的名稱。
 * @async
 * @function updateRegion
 * @param {number} id - 區域的 ID。
 * @param {string} area - 區域的新名稱。
 * @returns {Promise<boolean>} - 成功更新時返回 true，否則返回 false。
 * @throws {Error} - 如果更新過程中發生錯誤，拋出錯誤。
 */
async function updateRegionName(id, area) {
  let conn;
  try {
    conn = await db.pool.getConnection();
    const query = `
      UPDATE regions
      SET area = ?
      WHERE id = ?;
    `;
    const [result] = await conn.query(query, [area, id]);
    conn.release();
    return result.affectedRows > 0; // 如果有更新的行數，表示更新成功
  } catch (error) {
    console.error('更新區域名稱時發生錯誤:', error);
    if (conn) conn.release();
    throw error;
  }
}


/**
 * 確認區域 ID 是否存在於 regions 表中。
 * @async
 * @function regionExists
 * @param {number} id - 區域的 ID。
 * @returns {Promise<boolean>} - 如果存在返回 true，否則返回 false。
 * @throws {Error} - 如果查詢過程中發生錯誤，拋出錯誤。
 */
async function regionExists(id) {
  let conn;
  try {
    conn = await db.pool.getConnection();
    const query = `
      SELECT id FROM regions WHERE id = ?;
    `;
    const [rows] = await conn.query(query, [id]);
    conn.release();
    return rows.length > 0; // 如果有查詢結果，表示 ID 存在
  } catch (error) {
    console.error('查詢區域是否存在時發生錯誤:', error);
    if (conn) conn.release();
    throw error;
  }
}




module.exports = {
  getRegionCountersByDate, addRegion, deleteRegion, updateRegionName, regionExists
};
