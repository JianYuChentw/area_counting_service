const db = require('../db/db');

/**
 * 獲取指定區域計數器的完整資料，如果不存在則返回 false。
 * @async
 * @function areaRegionCounterExists
 * @param {number} id - 要確認的區域計數器 ID。
 * @returns {Promise<Object|boolean>} - 如果存在，返回計數器資料，否則返回 false。
 */
async function areaRegionCounterExists(id) {
  let conn;
  try {
    conn = await db.pool.getConnection();
    const query = 'SELECT * FROM region_counters WHERE id = ?;';
    const [rows] = await conn.query(query, [id]);
    conn.release();

    if (rows.length > 0) {
      return rows[0]; // 返回完整的計數器資料
    } else {
      return false; // 如果計數器不存在，返回 false
    }
  } catch (error) {
    console.error('獲取區域計數器資料時發生錯誤:', error);
    if (conn) conn.release();
    throw error;
  }
}



/**
 * 新增區域時段的計數器資料。
 * @async
 * @function addAreaRegionCounter
 * @param {Object} data - 包含新增區域時段資料的對象。
 * @param {number} data.region_id - 對應區域的 ID。
 * @param {string} data.counter_time - 計數時間區段，格式為 'HH:mm'。
 * @param {string} data.date - 計數的日期，格式為 'YYYY-MM-DD'。
 * @param {number} data.max_counter_value - 該區間的計數最大值。
 * @returns {Promise<Object>} - 返回新增的計數器資料。
 */
async function addAreaRegionCounter(data) {
  const { region_id, counter_time, date, max_counter_value } = data;  
  let conn;
  try {
    conn = await db.pool.getConnection();
    const query = `
      INSERT INTO region_counters (region_id, counter_time, date, max_counter_value, counter_value)
      VALUES (?, ?, ?, ?, ?);
    `;
    const [result] = await conn.query(query, [region_id, counter_time, date, max_counter_value, max_counter_value]);
    conn.release();
    return {
      id: result.insertId,
      region_id,
      counter_time,
      date,
      max_counter_value,
      counter_value: max_counter_value, // 預設的計數器值
    };
  } catch (error) {
    console.error('新增區域時段資料時發生錯誤:', error);
    if (conn) conn.release();
    throw error;
  }
}

/**
 * 刪除指定區域時段的資料。
 * @async
 * @function deleteAreaRegionCounter
 * @param {number} id - 要刪除的區域計數器 ID。
 * @returns {Promise<boolean>} - 成功刪除時返回 true，否則返回 false。
 */
async function deleteAreaRegionCounter(id) {
  let conn;
  try {
    conn = await db.pool.getConnection();
    const query = 'DELETE FROM region_counters WHERE id = ?;';
    const [result] = await conn.query(query, [id]);
    conn.release();
    return result.affectedRows > 0; // 如果有刪除的行數，表示刪除成功
  } catch (error) {
    console.error('刪除區域時段資料時發生錯誤:', error);
    if (conn) conn.release();
    throw error;
  }
}

/**
 * 根據指定的計數器 ID 增加或減少計數器的值，並限制值在 0 到 max_counter_value 之間。
 * @async
 * @param {number} id - 計數器的唯一識別碼。
 * @param {string} operation - 操作類型，應為 'increment' 或 'decrement'。
 * @returns {Promise<number|boolean>} - 成功時返回更新後的計數器值，失敗時返回 false。
 * @throws {Error} - 如果查詢或更新過程中發生錯誤，將在控制台記錄錯誤。
 */
async function updateAreaCounterValueById(id, operation) {
  let conn;
  try {
    conn = await db.pool.getConnection();
    
    // 取得當前的 counter_value 和 max_counter_value
    const selectQuery = `
      SELECT counter_value, max_counter_value FROM region_counters WHERE id = ?;
    `;
    
    const [rows] = await conn.query(selectQuery, [id]);
    
    if (rows.length === 0) {
      console.log('未找到對應的計數器紀錄');
      return false; // 未找到紀錄時返回 false
    }
    
    let currentValue = rows[0].counter_value;
    const maxCounterValue = rows[0].max_counter_value;

    // 根據操作類型增減計數器數值並限制最小值為 0 和最大值為 max_counter_value
    if (operation === 'increment') {
      if (currentValue >= maxCounterValue) {
        console.log(`計數器已達最大值: ${maxCounterValue}`);
        return false; // 當計數器達到最大值時返回 false
      }
      currentValue++;
    } else if (operation === 'decrement') {
      if (currentValue <= 0) {
        console.log('計數器已達最小值: 0');
        return false; // 當計數器達到最小值時返回 false
      }
      currentValue--;
    }

    // 更新資料庫中的 counter_value
    const updateQuery = `
      UPDATE region_counters
      SET counter_value = ?
      WHERE id = ?;
    `;
    
    await conn.query(updateQuery, [currentValue, id]);
    
    return currentValue; // 成功更新後返回當前值
    
  } catch (error) {
    console.error('更新計數器時發生錯誤:', error);
    return false; // 發生錯誤時返回 false
  } finally {
    if (conn) conn.release(); // 釋放連線
  }
}

/**
 * 編輯指定區域時段的資料。
 * @async
 * @function updateAreaRegionCounter
 * @param {number} id - 要編輯的區域計數器 ID。
 * @param {Object} data - 包含要更新的區域計數器資料。
 * @param {string} [data.counter_time] - 可選的計數時間區段，格式為 'HH:mm'。
 * @param {string} [data.date] - 可選的計數日期，格式為 'YYYY-MM-DD'。
 * @param {number} [data.max_counter_value] - 可選的計數最大值。
 * @param {number} [data.counter_value] - 可選的當前計數值。
 * @param {boolean} [data.state] - 可選的區域計數器狀態。
 * @returns {Promise<boolean>} - 成功更新時返回 true，否則返回 false。
 */
async function updateAreaRegionCounter(id, data) {
  let conn;
  try {
    conn = await db.pool.getConnection();
    
    const fields = [];
    const values = [];

    // 構建更新的 SQL 字段和值
    if (data.counter_time) {
      fields.push('counter_time = ?');
      values.push(data.counter_time);
    }
    if (data.date) {
      fields.push('date = ?');
      values.push(data.date);
    }
    if (data.max_counter_value) {
      fields.push('max_counter_value = ?');
      values.push(data.max_counter_value);
    }
    if (data.counter_value) {
      fields.push('counter_value = ?');
      values.push(data.counter_value);
    }
    if (typeof data.state !== 'undefined') {
      fields.push('state = ?');
      values.push(data.state);
    }

    // 如果沒有要更新的字段，返回 false
    if (fields.length === 0) {
      return false;
    }

    const query = `
      UPDATE region_counters
      SET ${fields.join(', ')}
      WHERE id = ?;
    `;
    
    values.push(id);
    const [result] = await conn.query(query, values);
    conn.release();
    return result.affectedRows > 0; // 如果有更新的行數，表示更新成功
  } catch (error) {
    console.error('更新區域時段資料時發生錯誤:', error);
    if (conn) conn.release();
    throw error;
  }
}



module.exports = {
  areaRegionCounterExists, 
  addAreaRegionCounter,
  deleteAreaRegionCounter,
  updateAreaCounterValueById,
  updateAreaRegionCounter
};
