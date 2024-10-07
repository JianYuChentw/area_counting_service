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
    if (data.max_counter_value || data.max_counter_value === 0) {
      fields.push('max_counter_value = ?');
      values.push(data.max_counter_value);
    }
    if (data.counter_value || data.counter_value === 0) {
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

    // 查詢當前的 counter_value 和 max_counter_value
    const [currentData] = await conn.query('SELECT counter_value, max_counter_value FROM region_counters WHERE id = ?', [id]);
    const currentCounterValue = currentData[0]?.counter_value;
    const currentMaxCounterValue = currentData[0]?.max_counter_value;

    // 如果更新 max_counter_value，檢查是增加還是減少
    if (data.max_counter_value || data.max_counter_value === 0) {
      const deltaMaxCounterValue = data.max_counter_value - currentMaxCounterValue;

      // 如果 max_counter_value 增加，counter_value 也跟著增加同樣的數量
      if (deltaMaxCounterValue > 0) {
        fields.push('counter_value = ?');
        values.push(currentCounterValue+1);
      }

      // 如果 max_counter_value 減少，且當前的 counter_value 超過新的 max_counter_value，將 counter_value 設為新的 max_counter_value
      if (deltaMaxCounterValue < 0 && currentCounterValue > data.max_counter_value) {
        fields.push('counter_value = ?');
        values.push(data.max_counter_value);
      }
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

/**
 * 檢索符合多個條件的 region_counters 資料
 * @fires conditionsGetRegionCounters
 * @param {Object} filters - 檢索的條件
 * @param {number} [filters.regionId] - 區域的 ID (region_id)
 * @param {string} [filters.date] - 指定的日期，格式為 'YYYY-MM-DD'
 * @param {string} [filters.counterTime] - 指定的計數時間，格式為 'HH:MM:SS'
 * @param {number} [filters.state] - 狀態值，1 為啟用，0 為停用
 * @param {number} [filters.maxCounterValue] - 最大計數值，用來篩選 max_counter_value 小於或等於此值的記錄
 * @returns {Promise<Array<Object>>} 返回符合條件的 region_counters 資料
 * @throws {Error} 如果查詢失敗，會拋出錯誤
 */
async function conditionsGetRegionCounters({ regionId, date, counterTime, state, maxCounterValue }) {
  let query = `
    SELECT * FROM region_counters
    WHERE 1=1
  `;
  const params = [];

  // 加入條件篩選
  if (regionId) {
    query += ' AND region_id = ?';
    params.push(regionId);
  }
  
  if (date) {
    query += ' AND date = ?';
    params.push(date);
  }
  
  if (counterTime) {
    query += ' AND counter_time = ?';
    params.push(counterTime);
  }

  if (state !== undefined) {
    query += ' AND state = ?';
    params.push(state);
  }
  
  if (maxCounterValue) {
    query += ' AND max_counter_value <= ?';
    params.push(maxCounterValue);
  }

  // 執行查詢
  const [rows] = await db.pool.query(query, params);
  return rows;
}

/**
 * 拉取指定日期範圍內的region_counters 資料，。
 * @async
 * @function getRegionCountersByDateRange
 * @param {string} startDate - 查詢開始的日期 (格式: YYYY-MM-DD)。
 * @param {string} endDate - 查詢結束的日期 (格式: YYYY-MM-DD)。
 * @returns {Promise<Array<Object>>} - 返回包含 region_counters 主表的資料，並附加區域名稱。
 */
async function getRegionCountersByDateRange(startDate, endDate) {
  let conn;
  try {
    conn = await db.pool.getConnection();

    const query = `
      SELECT 
        DATE_FORMAT(rc.date, '%Y-%m-%d') AS date,  -- 確保日期格式為 YYYY-MM-DD
        rc.region_id,
        rc.state,
        r.area AS region_area
      FROM region_counters rc
      JOIN regions r ON rc.region_id = r.id
      WHERE rc.date BETWEEN ? AND ?
      GROUP BY rc.date, rc.region_id, rc.state
      ORDER BY rc.date, rc.region_id
    `;

    // 執行查詢，拉取日期範圍內的資料
    const [rows] = await conn.query(query, [startDate, endDate]);
    
    return rows;
  } catch (err) {
    console.error('拉取 region_counters 資料過程中出錯:', err);
    throw err;
  } finally {
    if (conn) {
      conn.release(); // 確保釋放資料庫連線
    }
  }
}


/**
 * 根據 `date` 更新區域的 state，並可選擇指定 `region_id`。
 * @param {Object} options - 更新選項，包含 `date` 和可選的 `region_id`。
 * @param {string} options.date - 要更新的日期，格式為 YYYY-MM-DD (必須)。
 * @param {number} [options.region_id] - 要更新的區域 ID (可選)。
 * @param {number} newState - 要設置的 state 值 (0 或 1) (必須)。
 * @returns {Promise} - 返回更新結果。
 * @throws {Error} - 如果沒有提供 `date` 或 `state`，拋出錯誤。
 */
async function updateRegionCountersState({ date, region_id }, newState) {
  
  let conn;
  try {
    // 獲取資料庫連接
    conn = await db.pool.getConnection();
    
    let query = `
      UPDATE region_counters
      SET state = ?, updated_at = CURRENT_TIMESTAMP
      WHERE date = ?
    `;
    const params = [newState, date];

    // 如果提供了 region_id，則添加條件更新指定區域
    if (region_id) {
      query += ` AND region_id = ?`;
      params.push(region_id);
    }
    // 執行更新查詢
    const [result] = await conn.query(query, params);
    
    return result.changedRows > 0
    
  } catch (err) {
    console.error('更新區域 state 時發生錯誤:', err);
    throw err;
  } finally {
    // 確保連接被釋放
    if (conn) conn.release();
  }
}



module.exports = {
  areaRegionCounterExists, 
  addAreaRegionCounter,
  deleteAreaRegionCounter,
  updateAreaCounterValueById,
  updateAreaRegionCounter,
  conditionsGetRegionCounters,
  getRegionCountersByDateRange,
  updateRegionCountersState
};
