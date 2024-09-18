const { addAreaRegionCounter, deleteAreaRegionCounter, updateAreaRegionCounter, areaRegionCounterExists } = require('../model/areaTimePeriod');
const { regionExists } = require('../model/area');

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
 * 更新區域時段的計數器資料
 * @async
 * @function updateAreaTimePeriodCounter
 * @param {Object} req - Express 的請求對象，包含路徑中的 ID 和請求體中的更新資料。
 * @param {Object} res - Express 的回應對象，用來返回結果或錯誤訊息。
 * @returns {Promise<void>} - 當請求完成時，回應對象會返回更新結果或錯誤訊息。
 */
async function updateAreaTimePeriodCounter(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    // 確認區域計數器是否存在
    const exists = await areaRegionCounterExists(id);
    if (!exists) {
      return res.status(404).json({ message: `區域時段計數器 ID ${id} 不存在` });
    }

    // 更新區域時段資料
    const updated = await updateAreaRegionCounter(id, data);
    if (updated) {
      return res.status(200).json({ message: `區域時段計數器 ID ${id} 已成功更新` });
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
