const { pool } = require('./db/db');  // 引入資料庫連線池
const cron = require('node-cron');

// 獲取當天日期與未來10天的日期
function getDatesForNextTenDays() {
  const dates = [];
  const today = new Date();
  
  for (let i = 0; i < 10; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    dates.push(futureDate.toISOString().slice(0, 10)); // YYYY-MM-DD 格式
  }

  return dates;
}

// 檢查並插入 region_counters 資料
async function checkAndInsertRegionCounters() {
  let conn;
  try {
    conn = await pool.getConnection();
    
    console.log('已成功連線資料庫，開始檢查 region_counters...');
    
    // 獲取所有區域與時段
    const [regions] = await conn.query('SELECT * FROM regions');
    const [timePeriods] = await conn.query('SELECT * FROM time_periods');

    console.log(`獲取到 ${regions.length} 個區域，${timePeriods.length} 個時段`);

    // 獲取接下來10天的日期
    const futureDates = getDatesForNextTenDays();
    console.log('未來 10 天日期範圍:', futureDates.join(', '));

    for (const region of regions) {
      console.log(`檢查區域: ${region.name} (ID: ${region.id})`);
      
      for (const timePeriod of timePeriods) {
        console.log(`  檢查時段: ${timePeriod.start_time} - ${timePeriod.end_time}`);

        for (const date of futureDates) {
          console.log(`    檢查日期: ${date}`);
          
          // 檢查該區域、時段、日期是否已有資料
          const [existingRecords] = await conn.query(
            'SELECT * FROM region_counters WHERE region_id = ? AND counter_time = ? AND date = ?',
            [region.id, timePeriod.start_time, date]
          );

          if (existingRecords.length === 0) {
            console.log(`      未找到記錄，插入新資料...`);
            await conn.query(
              'INSERT INTO region_counters (region_id, counter_time, date, max_counter_value, counter_value) VALUES (?, ?, ?, ?, ?)',
              [region.id, timePeriod.start_time, date, region.max_count, region.max_count]
            );
            console.log(`      已插入: 區域 ${region.name}，日期 ${date}，時段 ${timePeriod.start_time}`);
          } else {
            console.log(`      已存在記錄，跳過插入`);
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
    checkAndInsertRegionCounters
}