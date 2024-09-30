const db = require('../db/db');

/**
 * 新增一筆操作記錄到資料庫
 * 
 * @param {string} record_date - 記錄的日期 (格式: YYYY-MM-DD)
 * @param {string} time_period - 時間片，例如 'morning', 'afternoon', 'evening'
 * @param {string} content - 記錄的內容文字
 * @returns {Promise<number>} 新增記錄的 ID
 * @throws {Error} 如果新增過程發生錯誤，會拋出錯誤
 */
async function addRecord(record_date, time_period, content) {
  const query = `
    INSERT INTO operate_records (record_date, time_period, content)
    VALUES (?, ?, ?)
  `;
  
  let conn;
  try {
    conn = await db.pool.getConnection(); // 獲取連接
    const [result] = await conn.execute(query, [record_date, time_period, content]);
    // console.log('Record added successfully:', result.insertId);
    return result.insertId; // 回傳新增的ID
  } catch (error) {
    console.error('Error adding record:', error);
    throw error;
  } finally {
    if (conn) conn.release(); // 釋放連接
  }
}

/**
 * 根據日期範圍和時間片來條件篩選操作記錄
 * 
 * @param {string} [startDate] - 起始日期 (格式: YYYY-MM-DD)
 * @param {string} [endDate] - 結束日期 (格式: YYYY-MM-DD)
 * @param {string} [timePeriod] - 時間片，例如 'morning', 'afternoon', 'evening'
 * @returns {Promise<Object[]>} 篩選後的操作記錄列表
 * @throws {Error} 如果讀取過程發生錯誤，會拋出錯誤
 */
async function getRecordsByConditions(startDate, endDate, timePeriod) {
    let query = `
      SELECT id, record_date, time_period, content, created_at, updated_at
      FROM operate_records
      WHERE 1=1
    `;
  
    const params = [];
  
    // 根據提供的條件構建查詢
    if (startDate && endDate) {
      query += ` AND record_date BETWEEN ? AND ?`;
      params.push(startDate, endDate);
    }
  
    if (timePeriod) {
      query += ` AND time_period = ?`;
      params.push(timePeriod);
    }
  
    let conn;
    try {
      conn = await db.pool.getConnection(); // 獲取連接
      const [rows] = await conn.execute(query, params);
      return rows; // 回傳記錄
    } catch (error) {
      console.error('Error fetching records by conditions:', error);
      throw error;
    } finally {
      if (conn) conn.release(); // 釋放連接
    }
}

/**
 * 根據 ID 刪除一筆操作記錄
 * 
 * @param {number} id - 要刪除的記錄 ID
 * @returns {Promise<boolean>} 是否成功刪除記錄
 * @throws {Error} 如果刪除過程發生錯誤，會拋出錯誤
 */
async function deleteRecord(id) {
    const query = `
      DELETE FROM operate_records
      WHERE id = ?
    `;

    let conn;
    try {
      conn = await db.pool.getConnection(); // 獲取連接
      const [result] = await conn.execute(query, [id]);
      if (result.affectedRows > 0) {
        console.log('Record deleted successfully:', id);
        return true; // 刪除成功
      } else {
        console.log('No record found with id:', id);
        return false; // 沒有找到記錄
      }
    } catch (error) {
      console.error('Error deleting record:', error);
      throw error;
    } finally {
      if (conn) conn.release(); // 釋放連接
    }
}

module.exports = { addRecord, getRecordsByConditions, deleteRecord };
