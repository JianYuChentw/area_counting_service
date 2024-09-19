const { getRegionCountersByDate } = require('../model/area');
const { getTaiwanDate } = require('../utils/utils')

/**
 * 初始化快取，將指定日期的區域計數器資料存入快取。
 * @async
 * @function initCache
 * @param {Object} cache - 用來存放快取資料的對象。
 * @returns {Promise<void>} - 當快取初始化完成時，回應無具體值。
 * @throws {Error} - 如果初始化過程中發生錯誤，會在控制台記錄錯誤。
 */
async function initCache(cache) {
  // 獲取台灣當日日期
  const todayInTaiwan = getTaiwanDate();
  
  // 使用當日日期來初始化快取
  const regionData = await getRegionCountersByDate(todayInTaiwan);
  cache[todayInTaiwan] = regionData;
  console.log('快取初始化完成', todayInTaiwan);
  // 如果需要檢查快取內容，可以取消註解
  // console.log('快取初始化完成', cache);
}

/**
 * 更新指定日期的快取，將區域計數器資料更新到快取中。
 * @async
 * @function updateCache
 * @param {string} date - 要更新快取的日期，格式為 YYYY-MM-DD。
 * @param {Object} cache - 用來存放快取資料的對象。
 * @returns {Promise<Object>} - 返回更新後的快取對象。
 * @throws {Error} - 如果更新過程中發生錯誤，會在控制台記錄錯誤。
 */
async function updateCache(date, cache) {
  const regionData = await getRegionCountersByDate(date);
  cache[date] = regionData;
  // console.log('快取更新完成');
  return cache;
}

module.exports = { initCache, updateCache };
