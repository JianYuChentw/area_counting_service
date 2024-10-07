const {
  addAreaRegionCounter,
  deleteAreaRegionCounter,
  updateAreaRegionCounter,
  areaRegionCounterExists,
  conditionsGetRegionCounters,
  getRegionCountersByDateRange,
  updateRegionCountersState
} = require('../model/areaTimePeriod');
const { regionExists, getRegionCountersByDate } = require('../model/area');
const { getCacheStatus } = require('../service/webSocket');

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

    // 確認是否已存在同一時段的計數器
    const singleDayCounter = await conditionsGetRegionCounters({
      regionId: region_id,
      date: date,
      counterTime: counter_time,
    });

    if (singleDayCounter.length > 0) {
      return res.status(409).json({ message: `該時段已存在` }); // 改為 409 衝突狀態碼
    }

    // 新增區域時段資料
    const newCounter = await addAreaRegionCounter({
      region_id,
      counter_time,
      date,
      max_counter_value,
    });

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
      return res
        .status(404)
        .json({ message: `區域時段計數器 ID ${id} 不存在` });
    }

    // 刪除區域時段資料
    const deleted = await deleteAreaRegionCounter(id);
    if (deleted) {
      return res
        .status(200)
        .json({ message: `區域時段計數器 ID ${id} 已成功刪除` });
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
      return res
        .status(404)
        .json({ message: `區域時段計數器 ID ${id} 不存在` });
    }

    // 從查詢結果中獲取當前的最大計數值
    let maxCounterValue = regionCounter.max_counter_value;

    // 根據操作類型進行最大計數值的增減
    if (operation === 'increment') {
      maxCounterValue++; // 增加最大計數值
    } else if (operation === 'decrement') {
      if (maxCounterValue < 0) {
        return res.status(400).json({ message: '最大計數值不能小於 0' });
      }
      maxCounterValue--; // 減少最大計數值
    } else {
      return res.status(400).json({ message: '無效的操作類型' });
    }

    // 更新最大計數值
    const updated = await updateAreaRegionCounter(id, {
      max_counter_value: maxCounterValue,
    });
    console.log(updated);

    if (updated) {
      return res
        .status(200)
        .json({
          message: `區域時段計數器 ID ${id} 的最大計數值已成功更新`,
          max_counter_value: maxCounterValue,
        });
    } else {
      return res.status(500).json({ message: '更新區域時段計數器時發生錯誤' });
    }
  } catch (error) {
    console.error('更新區域時段資料時發生錯誤:', error);
    res.status(500).json({ error: '伺服器發生錯誤，請稍後再試' });
  }
}


/**
 * 根據傳入的日期 (`date`) 和可選的區域 ID (`region_id`) 更新區域的狀態 (`state`)。
 * - 若系統目前正在進行快取處理，將會返回 503 狀態碼，表示無法進行操作。
 * - 若更新成功，將返回 200 狀態碼和成功訊息。
 * - 若更新失敗，將返回 500 狀態碼和錯誤訊息。
 *
 * @async
 * @function timePeriodupdateState
 * @param {Object} req - Express 的請求對象，包含查詢參數 `date`, `region_id`, 和 `state`。
 * @param {string} req.query.date - 要更新的日期，格式為 YYYY-MM-DD。
 * @param {string} [req.query.region_id] - 要更新的區域 ID（可選）。
 * @param {string} req.query.state - 新的狀態值（0 或 1）。
 * @param {Object} res - Express 的回應對象，用於發送狀態碼和結果給客戶端。
 * @returns {Promise<void>} - 無返回值。函數執行後會直接返回 HTTP 回應。
 * @throws {Error} - 如果更新操作失敗，將拋出錯誤並記錄錯誤日誌。
 */
async function timePeriodupdateState(req, res) {
  const { date, region_id, state } = req.query;
  const newState = parseInt(state, 10);
  try {
    // 檢查快取狀態
    if (getCacheStatus()) {
      return res.status(503).json({ message: '服務中，無法進行操作' });
    }
    // 調用整合後的 model 函數來更新 state
    const result = await updateRegionCountersState(
      { date, region_id },
      newState
    );

    res.status(200).json({ message: `成功更新 state` });
  } catch (err) {
    console.error('更新 state 時出錯:', err);
    res.status(500).json({ error: '無法更新 state' });
  }
}

/**
 * 從指定的日期範圍內拉取並整理 region_counters 資料。
 * 資料以日期為 key，並包含每個日期下不重複的區域 id、區域名稱和狀態。
 * @async
 * @function getRegionCounters
 * @param {Request} req - Express 的請求物件，包含查詢參數 startDate 和 endDate。
 * @param {Response} res - Express 的回應物件。
 */
async function getTimePeriodRegionCounters(req, res) {
  const { startDate, endDate } = req.query;

  try {
    // 從 model 獲取資料
    const rows = await getRegionCountersByDateRange(startDate, endDate);

    // 整理資料，以日期為 key
    const result = rows.reduce((acc, row) => {
      const { date, region_id, state, region_area } = row;

      // 如果當前日期尚未在 acc 中，則初始化一個空陣列
      if (!acc[date]) {
        acc[date] = [];
      }

      // 將資料 push 進對應日期的陣列
      acc[date].push({
        region_id,
        state,
        region_area,
      });

      return acc;
    }, {});

    res.status(200).json(result);
  } catch (err) {
    console.error('整理 region_counters 資料時出錯:', err);
    res.status(500).json({ error: '無法整理 region_counters 資料' });
  }
}

module.exports = {
  addAreaTimePeriodCounter,
  deleteAreaTimePeriodCounter,
  updateAreaTimePeriodCounter,
  getTimePeriodRegionCounters,
  timePeriodupdateState,
};
