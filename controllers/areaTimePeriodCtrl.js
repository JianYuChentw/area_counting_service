const { addAreaRegionCounter, deleteAreaRegionCounter, updateAreaRegionCounter, areaRegionCounterExists } = require('../model/areaTimePeriod');
const { regionExists } = require('../model/area');
const { getCacheStatus } = require('../service/webSocket'); // 引入 getCacheStatus

/**
 * 新增區域時段的計數器資料
 * @async
 * @function addAreaTimePeriodCounter
 * @param {Object} req - Express 的請求對象，包含請求體資料。
 * @param {Object} res - Express 的回應對象，用來返回結果或錯誤訊息。
 * @returns {Promise<void>} - 當請求完成時，回應對象會返回新增區域時段資料或錯誤訊息。
 */
async function addAreaTimePeriodCounter(req, res) {
  try {
    const { region_id, counter_time, date, max_counter_value } = req.body;

    
    // 確認快取狀態
  if (getCacheStatus()) {
    return res.status(503).json({ message: '服務中，無法進行新增操作' });
  }
    // 確認區域是否存在
    const exists = await regionExists(region_id);
    if (!exists) {
      return res.status(404).json({ message: `區域 ID ${region_id} 不存在` });
    }

    // 新增區域時段資料
    const newCounter = await addAreaRegionCounter({ region_id, counter_time, date, max_counter_value });
    res.status(201).json({
      message: '區域時段計數器資料已成功新增',
      counter: newCounter,
    });
  } catch (error) {
    console.error('新增區域時段資料時發生錯誤:', error);
    res.status(500).json({ error: '伺服器發生錯誤，請稍後再試' });
  }
}

/**
 * 刪除區域時段的計數器資料
 * @async
 * @function deleteAreaTimePeriodCounter
 * @param {Object} req - Express 的請求對象，包含路徑中的 ID。
 * @param {Object} res - Express 的回應對象，用來返回結果或錯誤訊息。
 * @returns {Promise<void>} - 當請求完成時，回應對象會返回刪除結果或錯誤訊息。
 */
async function deleteAreaTimePeriodCounter(req, res) {
  try {
    const { id } = req.params;
    console.log(id);
    
    if (getCacheStatus()) {
      return res.status(503).json({ message: '服務中，無法進行新增操作' });
    }

    // 確認區域計數器是否存在
    const exists = await areaRegionCounterExists(id);
    if (!exists) {
      return res.status(404).json({ message: `區域時段計數器 ID ${id} 不存在` });
    }

    // 刪除區域時段資料
    const deleted = await deleteAreaRegionCounter(id);
    if (deleted) {
      return res.status(200).json({ message: `區域時段計數器 ID ${id} 已成功刪除` });
    } else {
      return res.status(500).json({ message: '刪除區域時段計數器時發生錯誤' });
    }
  } catch (error) {
    console.error('刪除區域時段資料時發生錯誤:', error);
    res.status(500).json({ error: '伺服器發生錯誤，請稍後再試' });
  }
}

/**
 * 根據操作類型增減區域時段的最大計數值
 * @async
 * @function updateAreaTimePeriodCounter
 * @param {Object} req - Express 的請求對象，包含路徑中的 ID 和請求體中的操作資料。
 * @param {Object} res - Express 的回應對象，用來返回結果或錯誤訊息。
 * @returns {Promise<void>} - 當請求完成時，回應對象會返回更新結果或錯誤訊息。
 */
async function updateAreaTimePeriodCounter(req, res) {
  try {
    const { id } = req.params;
    const { operation } = req.body; // 從請求體中獲取 operation

    // 檢查快取狀態
    if (getCacheStatus()) {
      return res.status(503).json({ message: '服務中，無法進行操作' });
    }

    // 使用 areaRegionCounterExists 來確認計數器是否存在並獲取其完整資料
    const regionCounter = await areaRegionCounterExists(id);
    if (!regionCounter) {
      return res.status(404).json({ message: `區域時段計數器 ID ${id} 不存在` });
    }

    // 從查詢結果中獲取當前的最大計數值
    let maxCounterValue = regionCounter.max_counter_value;

    // 根據操作類型進行最大計數值的增減
    if (operation === 'increment') {
      maxCounterValue++; // 增加最大計數值
    } else if (operation === 'decrement') {
      if (maxCounterValue <= 1) {
        return res.status(400).json({ message: '最大計數值不能小於 1' });
      }
      maxCounterValue--; // 減少最大計數值
    } else {
      return res.status(400).json({ message: '無效的操作類型' });
    }

    // 更新最大計數值
    const updated = await updateAreaRegionCounter(id, { max_counter_value: maxCounterValue });
    if (updated) {
      return res.status(200).json({ message: `區域時段計數器 ID ${id} 的最大計數值已成功更新`, max_counter_value: maxCounterValue });
    } else {
      return res.status(500).json({ message: '更新區域時段計數器時發生錯誤' });
    }
  } catch (error) {
    console.error('更新區域時段資料時發生錯誤:', error);
    res.status(500).json({ error: '伺服器發生錯誤，請稍後再試' });
  }
}



module.exports = {
  addAreaTimePeriodCounter,
  deleteAreaTimePeriodCounter,
  updateAreaTimePeriodCounter
};
