const { getRegionCountersByDate } = require('../model/area');

// 初始化快取
async function initCache(cache) {
  const regionData = await getRegionCountersByDate('2024-09-01');
  cache['2024-09-01'] = regionData;
  console.log('快取初始化完成', cache);
}

// 更新快取
async function updateCache(date, cache) {
  const regionData = await getRegionCountersByDate(date);
  cache[date] = regionData;
  console.log('快取更新完成');
  return cache;
}

module.exports = { initCache, updateCache };
