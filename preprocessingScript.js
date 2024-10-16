const { pool } = require('./db/db'); // 引入資料庫連線池
const cron = require('node-cron');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

// 獲取當天日期與未來10天的日期（台北時間）
function getDatesForNextTenDays() {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 10; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);

    // 將時間調整為台北時間 (UTC+8)
    const taipeiDate = new Date(
      futureDate.toLocaleString('en-US', { timeZone: 'Asia/Taipei' })
    );
    dates.push(taipeiDate.toISOString().slice(0, 10)); // YYYY-MM-DD 格式
  }

  return dates;
}

/**
 * 刪除超過前七天的 operate_records 資料（以台北時間計算）。
 * @async
 * @function deleteOldOperateRecords
 * @returns {Promise<void>} - 當刪除操作完成時，回應無具體值。
 * @throws {Error} - 如果刪除過程中出錯，會在控制台記錄錯誤。
 */
async function deleteOldOperateRecords() {
  let conn;
  try {
    conn = await pool.getConnection();

    console.log('開始刪除超過前七天的 operate_records 資料...');

    // 計算7天前的台北時間日期
    const sevenDaysAgo = dayjs()
      .tz('Asia/Taipei')
      .subtract(7, 'days')
      .format('YYYY-MM-DD');

    // 刪除7天前的資料
    const [result] = await conn.query(
      'DELETE FROM operate_records WHERE record_date < ?',
      [sevenDaysAgo]
    );

    console.log(
      `已刪除 ${result.affectedRows} 條超過前七天的 operate_records 資料`
    );
  } catch (err) {
    console.error('刪除 operate_records 資料過程中出錯:', err);
  } finally {
    if (conn) {
      conn.release(); // 確保釋放連線
    }
  }
}

/**
 * 刪除超過前七天的 region_counters 資料（以台北時間計算）。
 * @async
 * @function deleteOldRegionCounters
 * @returns {Promise<void>} - 當刪除操作完成時，回應無具體值。
 * @throws {Error} - 如果刪除過程中出錯，會在控制台記錄錯誤。
 */

async function deleteOldRegionCounters() {
  let conn;
  try {
    conn = await pool.getConnection();

    console.log('開始刪除超過前七天的 region_counters 資料...');

    // 計算七天前的台北時間日期
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // 將時間調整為台北時間 (UTC+8)
    const taipeiCutoffDate = new Date(
      sevenDaysAgo.toLocaleString('en-US', { timeZone: 'Asia/Taipei' })
    );
    const cutoffDate = taipeiCutoffDate.toISOString().slice(0, 10); // YYYY-MM-DD 格式

    // 刪除七天前的資料
    const [result] = await conn.query(
      'DELETE FROM region_counters WHERE date < ?',
      [cutoffDate]
    );

    console.log(
      `已刪除 ${result.affectedRows} 條超過七天前的 region_counters 資料`
    );
  } catch (err) {
    console.error('刪除 region_counters 資料過程中出錯:', err);
  } finally {
    if (conn) {
      conn.release(); // 確保釋放連線
    }
  }
}

// 檢查並插入 region_counters 資料（以台北時間計算）
async function checkAndInsertRegionCounters() {
  let conn;
  try {
    // 刪除台北時間7天前的 operate_records 資料
    await deleteOldOperateRecords();

    // 刪除7天前的資料
    await deleteOldRegionCounters();

    conn = await pool.getConnection();

    console.log('已成功連線資料庫，開始檢查 region_counters...');

    // 獲取所有區域
    const [regions] = await conn.query('SELECT * FROM regions');
    console.log(`獲取到 ${regions.length} 個區域`);

    // 獲取接下來10天的日期（台北時間）
    const futureDates = getDatesForNextTenDays();
    console.log('未來 10 天日期範圍:', futureDates.join(', '));

    // 開始遍歷每個區域
    for (const region of regions) {
      console.log(`檢查區域: ${region.area} (ID: ${region.id})`);

      // 查詢該區域的歷史時段資料
      const queryHistory = `
        SELECT region_id, counter_time, max_counter_value, counter_value
        FROM region_counters
        WHERE region_id = ? AND date = ?`;

      // 查詢今天的歷史資料作為未來時段的參考
      const [historyTimePeriods] = await conn.query(queryHistory, [region.id, futureDates[0]]);
      console.log(`獲取到 ${historyTimePeriods.length} 條歷史時段資料`);

      // 如果沒有歷史資料，跳過這個區域
      if (historyTimePeriods.length === 0) {
        console.log(`未找到區域 ${region.area} 的歷史時段資料，跳過...`);
        continue;
      }

      // 遍歷未來 10 天
      for (const date of futureDates) {
        // console.log(`  檢查日期: ${date}`);

        // 使用歷史時段替代 timePeriods
        for (const historyTimePeriod of historyTimePeriods) {
          // console.log(`    檢查時段: ${historyTimePeriod.counter_time}`);

          // 檢查該區域、時段、日期是否已有資料
          const [existingRecords] = await conn.query(
            'SELECT * FROM region_counters WHERE region_id = ? AND counter_time = ? AND date = ?',
            [region.id, historyTimePeriod.counter_time, date]
          );

          if (existingRecords.length === 0) {
            console.log(`      未找到記錄，插入新資料...`);
            await conn.query(
              'INSERT INTO region_counters (region_id, counter_time, date, max_counter_value, counter_value) VALUES (?, ?, ?, ?, ?)',
              [
                region.id,
                historyTimePeriod.counter_time,
                date,
                historyTimePeriod.max_counter_value,
                historyTimePeriod.counter_value,
              ]
            );
            console.log(
              `      已插入: 區域 ${region.area}，日期 ${date}，時段 ${historyTimePeriod.counter_time}`
            );
          } else {
            // console.log(`      已存在記錄，跳過插入`);
          }
        }
      }
    }

    console.log('所有資料檢查與插入完成');
  } catch (err) {
    console.error('檢查和插入 region_counters 過程中出錯:', err);
  } finally {
    if (conn) {
      conn.release(); // 確保釋放連線
    }
  }
}


module.exports = {
  checkAndInsertRegionCounters,
};
