const { getRegionCountersByDate, deleteRegion, updateRegion, addRegion, regionExists, getAllRegions } = require('../model/area');
const { getAllTimePeriods } = require('../model/timePeriod'); // 查詢所有時間段
const { addAreaRegionCounter } = require('../model/areaTimePeriod'); // 新增區域的時間段資料
const { getCacheStatus } = require('../service/webSocket'); // 引入 getCacheStatus
const { getDatesForNextTenDaysFrom } = require('../utils/utils'); 

/**
 * 取得指定日期的區域計數器資料
 * @async
 * @function getRegionCounters
 * @param {Object} req - Express 的請求對象，包含查詢參數 `date`。
 * @param {Object} res - Express 的回應對象，用來返回結果或錯誤訊息。
 * @returns {Promise<void>} - 當請求完成時，回應對象會返回區域計數器資料或錯誤訊息。
 * @throws {Error} - 如果發生錯誤，會返回 500 錯誤狀態碼和錯誤訊息。
 */
async function getRegionCounters(req, res) {
  try {
    const date = req.query.date;
    const counters = await getRegionCountersByDate(date);

    if (!counters || counters.length === 0) {
      return res.status(404).json({ message: '無法找到對應的區域計數資料' });
    }

    res.status(200).json(counters);
  } catch (error) {
    console.error('取得區域計數器資料時發生錯誤:', error);
    res.status(500).json({ error: '伺服器發生錯誤，請稍後再試' });
  }
}

/**
 * 取得指定日期的區域名稱與ID
 * @async
 * @function getRegionName
 * @param {Object} req - Express 請求物件，包含查詢參數 `date`
 * @param {Object} res - Express 回應物件，用於回傳結果或錯誤訊息
 * @returns {Promise<void>} - 回傳篩選後的區域 ID 和名稱，若無資料則回傳 404 錯誤
 * @throws {Error} - 若伺服器發生錯誤，則回傳 500 錯誤
 */
async function getSingleDayRegionName(req, res) {
  try {
    const date = req.query.date;
    const counters = await getRegionCountersByDate(date);

    if (!counters || counters.length === 0) {
      return res.status(404).json({ message: '無法找到對應的區域計數資料' });
    }

    // 從 counters 過濾重複的 area 名稱
    const seenAreas = new Set();
    const areaName = counters
      .filter(counter => {
        if (!seenAreas.has(counter.area)) {
          seenAreas.add(counter.area);
          return true;
        }
        return false;
      })
      .map(counter => counter.area);

    // 取得所有區域資料
    const allRegions = await getAllRegions();

    // 比對所有區域資料與 areaName，篩選出符合的資料
    const filteredRegions = allRegions
      .filter(region => areaName.includes(region.area))
      .map(region => ({
        id: region.id,
        area: region.area
      }));

    if (filteredRegions.length === 0) {
      return res.status(404).json({ message: '無法找到對應的區域資料' });
    }

    // 回傳過濾後的區域資料
    res.status(200).json(filteredRegions);

  } catch (error) {
    console.error('取得區域計數器資料時發生錯誤:', error);
    res.status(500).json({ error: '伺服器發生錯誤，請稍後再試' });
  }
}



/**
 * 取得所有區域資料
 * @async
 * @function getAllRegionAreas
 * @param {Object} req - Express 的請求對象。
 * @param {Object} res - Express 的回應對象，用來返回區域資料或錯誤訊息。
 * @returns {Promise<void>} - 當請求完成時，回應對象會返回所有區域資料或錯誤訊息。
 */
async function getAllRegionAreas(req, res) {
  try {
    const regions = await getAllRegions();
    
    if (!regions || regions.length === 0) {
      return res.status(404).json({ message: '無法找到任何區域資料' });
    }
    res.status(200).json(regions);
  } catch (error) {
    console.error('取得所有區域資料時發生錯誤:', error);
    res.status(500).json({ error: '伺服器發生錯誤，請稍後再試' });
  }
}

/**
 * 新增區域及其對應的時間區段計數資料
 * @async
 * @function addRegionArea
 * @param {Object} req - Express 的請求對象，包含區域名稱、最大計數值和日期。
 * @param {Object} res - Express 的回應對象，用來返回結果或錯誤訊息。
 * @returns {Promise<void>} - 當請求完成時，返回新增區域及其對應時間段的計數資料或錯誤訊息。
 */
async function addRegionArea(req, res) {
  // 確認快取狀態
  if (getCacheStatus()) {
    return res.status(503).json({ message: '服務中，無法進行新增操作' });
  }

  const { area, max_count, date } = req.body; // 接收區域名稱、最大計數值和日期

  let conn;
  try {
    // 1. 新增區域資料
    const newRegion = await addRegion(area, max_count); // 新增區域，max_count 是可選的

    // 2. 查詢所有時間區段
    const timePeriods = await getAllTimePeriods();

    // 3. 取得傳遞的日期（前端傳遞的台北時間日期）
    const dates = getDatesForNextTenDaysFrom(date); // 根據傳遞的日期獲取未來10天的日期

    // 4. 為該區域的每個時間區段和日期新增計數器資料
    const promises = [];
    dates.forEach(date => {
      timePeriods.forEach(period => {
        // 為每個日期和時間區段創建計數器資料
        promises.push(addAreaRegionCounter({
          region_id: newRegion.id,
          counter_time: period.start_time, // 使用時間段的開始時間
          date: date, // 使用前端傳來的日期
          max_counter_value: max_count || 3, // 使用區域的最大計數值，默認為 3
        }));
      });
    });

    await Promise.all(promises); // 等待所有區段計數資料新增完成

    res.status(201).json({
      message: `區域 ${area} 已成功新增並建立所有時間段計數資料（包含當日及未來10天）`,
      region: newRegion,
    });
  } catch (error) {
    console.error('新增區域及時間段資料時發生錯誤:', error);
    res.status(500).json({ error: '伺服器發生錯誤，請稍後再試' });
  }
}

/**
 * 刪除區域
 * @async
 * @function deleteRegionArea
 * @param {Object} req - Express 的請求對象，包含區域 ID。
 * @param {Object} res - Express 的回應對象，用來返回結果或錯誤訊息。
 * @returns {Promise<void>} - 當請求完成時，回應對象會返回刪除結果或錯誤訊息。
 */
async function deleteRegionArea(req, res) {
  // 確認快取狀態
  if (getCacheStatus()) {
    return res.status(503).json({ message: '服務中，無法進行刪除操作' });
  }

  try {
    const { id } = req.params;

    // 確認區域是否存在
    const exists = await regionExists(id);
    if (!exists) {
      return res.status(404).json({ message: `區域 ID ${id} 不存在` });
    }

    const deleted = await deleteRegion(id);
    if (deleted) {
      return res.status(200).json({ message: `區域 ID ${id} 已成功刪除` });
    } else {
      return res.status(500).json({ message: '刪除區域時發生錯誤' });
    }
  } catch (error) {
    console.error('刪除區域時發生錯誤:', error);
    res.status(500).json({ error: '伺服器發生錯誤，請稍後再試' });
  }
}

/**
 * 更新區域名稱及最大計數值
 * @async
 * @function updateRegionArea
 * @param {Object} req - Express 的請求對象，包含區域 ID、區域名稱和最大計數值。
 * @param {Object} res - Express 的回應對象，用來返回結果或錯誤訊息。
 * @returns {Promise<void>} - 當請求完成時，回應對象會返回更新結果或錯誤訊息。
 */
async function updateRegionArea(req, res) {
  // 確認快取狀態
  if (getCacheStatus()) {
    return res.status(503).json({ message: '服務中，無法進行更新操作' });
  }

  try {
    const { id } = req.params;
    const { area, max_count } = req.body;

    // 確認區域是否存在
    const exists = await regionExists(id);
    if (!exists) {
      return res.status(404).json({ message: `區域 ID ${id} 不存在` });
    }

    // 更新區域名稱和最大計數值
    const updated = await updateRegion(id, { area, max_count });
    if (updated) {
      return res.status(200).json({ message: `區域 ID ${id} 的資料已成功更新` });
    } else {
      return res.status(500).json({ message: '更新區域時發生錯誤' });
    }
  } catch (error) {
    console.error('更新區域資料時發生錯誤:', error);
    res.status(500).json({ error: '伺服器發生錯誤，請稍後再試' });
  }
}

module.exports = {
  getRegionCounters,
  getAllRegionAreas,
  addRegionArea,
  deleteRegionArea,
  updateRegionArea,
  getSingleDayRegionName
};
