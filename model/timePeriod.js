const db = require('../db/db');



/**
 * 新增一個時間區段到 time_periods 表。如果沒有指定結束時間，則預設結束時間為開始時間加 30 分鐘。
 * @async
 * @function addTimePeriod
 * @param {string} start_time - 時間區段的開始時間，格式為 'HH:mm:ss'。
 * @param {string} [end_time] - 可選的時間區段結束時間，格式為 'HH:mm:ss'。如果不傳入，將自動設為開始時間加 30 分鐘。
 * @returns {Promise<Object>} - 返回新增的時間區段資料（ID、開始時間和結束時間）。
 * @throws {Error} - 如果新增過程中發生錯誤，拋出錯誤。
 */
async function addTimePeriod(start_time, end_time) {
    let conn;
    try {
      // 如果未提供結束時間，將開始時間加 30 分鐘
      if (!end_time) {
        const startDate = new Date(`1970-01-01T${start_time}Z`);
        const endDate = new Date(startDate.getTime() + 30 * 60 * 1000); // 加 30 分鐘
        end_time = endDate.toISOString().substr(11, 8); // 轉為 'HH:mm:ss' 格式
      }
  
      conn = await db.pool.getConnection();
      const query = `
        INSERT INTO time_periods (start_time, end_time)
        VALUES (?, ?);
      `;
      const [result] = await conn.query(query, [start_time, end_time]);
      conn.release();
      return {
        id: result.insertId,
        start_time,
        end_time,
      };
    } catch (error) {
      console.error('新增時間區段時發生錯誤:', error);
      if (conn) conn.release();
      throw error;
    }
  }

  
  /**
 * 查詢所有時間區段。
 * @async
 * @function getAllTimePeriods
 * @returns {Promise<Object[]>} - 返回所有時間區段的數組，每個對象包含 ID、開始時間和結束時間。
 * @throws {Error} - 如果查詢過程中發生錯誤，拋出錯誤。
 */
async function getAllTimePeriods() {
    let conn;
    try {
      conn = await db.pool.getConnection();
      const query = 'SELECT id, start_time, end_time FROM time_periods;';
      const [rows] = await conn.query(query);
      conn.release();
      return rows;
    } catch (error) {
      console.error('查詢時間區段時發生錯誤:', error);
      if (conn) conn.release();
      throw error;
    }
  }

  
  /**
 * 根據 ID 查詢指定的時間區段。
 * @async
 * @function getTimePeriodById
 * @param {number} id - 時間區段的唯一識別碼。
 * @returns {Promise<Object>} - 返回對應的時間區段資料，包含 ID、開始時間和結束時間。
 * @throws {Error} - 如果查詢過程中發生錯誤，或找不到指定 ID 的時間區段，拋出錯誤。
 */
async function getTimePeriodById(id) {
    let conn;
    try {
      conn = await db.pool.getConnection();
      const query = 'SELECT id, start_time, end_time FROM time_periods WHERE id = ?;';
      const [rows] = await conn.query(query, [id]);
      conn.release();
      if (rows.length === 0) {
        throw new Error(`未找到 ID 為 ${id} 的時間區段`);
      }
      return rows[0];
    } catch (error) {
      console.error('查詢時間區段時發生錯誤:', error);
      if (conn) conn.release();
      throw error;
    }
  }

  
  /**
 * 更新指定的時間區段。
 * @async
 * @function updateTimePeriod
 * @param {number} id - 時間區段的唯一識別碼。
 * @param {string} start_time - 新的開始時間，格式為 'HH:mm:ss'。
 * @param {string} end_time - 新的結束時間，格式為 'HH:mm:ss'。
 * @returns {Promise<boolean>} - 成功更新時返回 true，否則返回 false。
 * @throws {Error} - 如果更新過程中發生錯誤，拋出錯誤。
 */
async function updateTimePeriod(id, start_time, end_time) {
    let conn;
    try {
      conn = await db.pool.getConnection();
      const query = `
        UPDATE time_periods
        SET start_time = ?, end_time = ?
        WHERE id = ?;
      `;
      const [result] = await conn.query(query, [start_time, end_time, id]);
      conn.release();
      return result.affectedRows > 0; // 返回是否成功更新
    } catch (error) {
      console.error('更新時間區段時發生錯誤:', error);
      if (conn) conn.release();
      throw error;
    }
  }

  module.exports = {
    addTimePeriod,
    getAllTimePeriods,
    getTimePeriodById,
    updateTimePeriod,
  };
  