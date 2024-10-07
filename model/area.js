const db = require('../db/db');

/**
 * 根據指定的日期查詢區域計數器的資料，並包含計數器的值、最大值和狀態。
 * 可以選擇指定的 state 過濾條件，默認查詢 state = 1 的記錄。
 * @async
 * @param {string} date - 要查詢的日期，格式為 YYYY-MM-DD。
 * @param {number} [state=1] - (選填) 要查詢的狀態，預設為 1。
 * @returns {Promise<Object[]>} - 返回包含區域計數器資料的數組，每個對象包含區域名稱、計數器時間、日期、計數器值、最大計數器值和狀態。
 * @throws {Error} - 如果查詢過程中發生錯誤，將在控制台記錄錯誤。
 */
async function getRegionCountersByDate(date, state = 1) {
  let conn;
  try {
    conn = await db.pool.getConnection();
    
    // 查詢指定日期且滿足 state 條件的所有區域資料，並同時取得 max_counter_value 和 state
    const query = `
      SELECT rc.id, r.area, DATE_FORMAT(rc.counter_time, '%H:%i') as counter_time, 
             DATE_FORMAT(rc.date, '%Y/%m/%d') as date, rc.counter_value, rc.max_counter_value, rc.state
      FROM region_counters rc
      JOIN regions r ON rc.region_id = r.id
      WHERE DATE(rc.date) = ? AND rc.state = ?
      ORDER BY rc.counter_time;
    `;

    // 使用 prepared statement，避免 SQL 注入
    const [rows] = await conn.query(query, [date, state]);

    return rows;
    
  } catch (error) {
    console.error('查詢時發生錯誤:', error);
    throw error;
  } finally {
    if (conn) conn.release(); // 釋放連線
  }
}



/**
 * 取得所有區域資料的函數
 * @async
 * @function getAllRegions
 * @returns {Promise<Object[]>} - 返回所有區域資料的數組
 * @throws {Error} - 如果查詢過程中發生錯誤，會拋出錯誤
 */
async function getAllRegions() {
  let conn;
  try {
    // 從資料庫連接池取得連線
    conn = await db.pool.getConnection();

    // 查詢所有 regions 表的資料
    const query = 'SELECT id, area, max_count, created_at, updated_at FROM regions;';
    const [rows] = await conn.query(query);  // 查詢並取得結果
    
    return rows;  // 返回查詢結果

  } catch (error) {
    console.error('取得區域資料時發生錯誤:', error);
    throw error;
  } finally {
    if (conn) conn.release();  // 確保釋放資料庫連線
  }
}


/**
 * 新增區域名稱到 regions 表，處理特殊字符問題。
 * @async
 * @function addRegion
 * @param {string} area - 區域的名稱。
 * @param {number} [max_count=3] - 區域的最大計數值，預設為 3。
 * @returns {Promise<Object>} - 返回新增的區域資料（ID 和名稱）。
 * @throws {Error} - 如果新增過程中發生錯誤，拋出錯誤。
 */
async function addRegion(area, max_count = 3) {
  let conn;
  try {
    // 處理區域名稱中的特殊字符
    const sanitizedArea = area.replace(/\\/g, '\\\\').replace(/'/g, "\\'");  // 轉義反斜杠和單引號

    conn = await db.pool.getConnection();
    const query = `
      INSERT INTO regions (area, max_count)
      VALUES (?, ?);
    `;
    const [result] = await conn.query(query, [sanitizedArea, max_count]);
    conn.release();
    return {
      id: result.insertId,
      area: sanitizedArea,
      max_count
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
 * 更新指定區域的資料（名稱和最大計數值）。
 * @async
 * @function updateRegion
 * @param {number} id - 區域的 ID。
 * @param {Object} data - 包含要更新的區域資料，`area` 為名稱，`max_count` 為最大計數值。
 * @param {string} [data.area] - 可選的區域新名稱。
 * @param {number} [data.max_count] - 可選的最大計數值。
 * @returns {Promise<boolean>} - 成功更新時返回 true，否則返回 false。
 * @throws {Error} - 如果更新過程中發生錯誤，拋出錯誤。
 */
async function updateRegion(id, data) {
  let conn;
  try {
    conn = await db.pool.getConnection();
    
    const fields = [];
    const values = [];
    
    // 根據傳入的資料動態生成 SQL 查詢
    if (data.area) {
      fields.push('area = ?');
      values.push(data.area);
    }
    if (typeof data.max_count !== 'undefined') {
      fields.push('max_count = ?');
      values.push(data.max_count);
    }

    // 如果沒有要更新的資料，返回 false
    if (fields.length === 0) {
      return false;
    }

    const query = `
      UPDATE regions
      SET ${fields.join(', ')}
      WHERE id = ?;
    `;

    values.push(id);  // 把 ID 加到參數中
    const [result] = await conn.query(query, values);
    conn.release();
    
    return result.affectedRows > 0;  // 如果有更新的行數，表示更新成功

  } catch (error) {
    console.error('更新區域資料時發生錯誤:', error);
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
  getRegionCountersByDate, getAllRegions, addRegion, deleteRegion, updateRegion, regionExists
};
