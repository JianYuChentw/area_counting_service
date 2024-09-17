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
 * 根據指定的計數器 ID 增加或減少計數器的值，並限制值在 0 到 max_counter_value 之間。
 * @async
 * @param {number} id - 計數器的唯一識別碼。
 * @param {string} operation - 操作類型，應為 'increment' 或 'decrement'。
 * @returns {Promise<number|boolean>} - 成功時返回更新後的計數器值，失敗時返回 false。
 * @throws {Error} - 如果查詢或更新過程中發生錯誤，將在控制台記錄錯誤。
 */
async function updateCounterValueById(id, operation) {
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

    console.log(`更新計數器成功: ID = ${id}, 計數值 = ${currentValue}`);
    
    return currentValue; // 成功更新後返回當前值
    
  } catch (error) {
    console.error('更新計數器時發生錯誤:', error);
    return false; // 發生錯誤時返回 false
  } finally {
    if (conn) conn.release(); // 釋放連線
  }
}

module.exports = {
  getRegionCountersByDate,
  updateCounterValueById  
};
