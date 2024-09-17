const { getRegionCountersByDate, deleteRegion, updateRegion, addRegion, regionExists } = require('../model/area');

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
 * 新增區域
 * @async
 * @function addRegionController
 * @param {Object} req - Express 的請求對象，包含區域名稱。
 * @param {Object} res - Express 的回應對象，用來返回結果或錯誤訊息。
 * @returns {Promise<void>} - 當請求完成時，回應對象會返回新增區域結果或錯誤訊息。
 */
async function addRegionController(req, res) {
  try {
    const { area } = req.body;

    // 呼叫 model 層的 addRegion 函數來新增區域
    const newRegion = await addRegion(area);

    res.status(201).json({
      message: `區域 ${area} 已成功新增`,
      region: newRegion,
    });
  } catch (error) {
    console.error('新增區域時發生錯誤:', error);
    res.status(500).json({ error: '伺服器發生錯誤，請稍後再試' });
  }
}

/**
 * 刪除區域
 * @async
 * @function deleteRegionController
 * @param {Object} req - Express 的請求對象，包含區域 ID。
 * @param {Object} res - Express 的回應對象，用來返回結果或錯誤訊息。
 * @returns {Promise<void>} - 當請求完成時，回應對象會返回刪除結果或錯誤訊息。
 */
async function deleteRegionController(req, res) {
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
 * 更新區域
 * @async
 * @function updateRegionController
 * @param {Object} req - Express 的請求對象，包含區域 ID 和新名稱。
 * @param {Object} res - Express 的回應對象，用來返回結果或錯誤訊息。
 * @returns {Promise<void>} - 當請求完成時，回應對象會返回更新結果或錯誤訊息。
 */
async function updateRegionController(req, res) {
  try {
    const { id } = req.params;
    const { area } = req.body;

    // 確認區域是否存在
    const exists = await regionExists(id);
    if (!exists) {
      return res.status(404).json({ message: `區域 ID ${id} 不存在` });
    }

    const updated = await updateRegion(id, area);
    if (updated) {
      return res.status(200).json({ message: `區域 ID ${id} 的名稱已更新為 ${area}` });
    } else {
      return res.status(500).json({ message: '更新區域時發生錯誤' });
    }
  } catch (error) {
    console.error('更新區域時發生錯誤:', error);
    res.status(500).json({ error: '伺服器發生錯誤，請稍後再試' });
  }
}

module.exports = {
  getRegionCounters,
  addRegionController,
  deleteRegionController,
  updateRegionController,
};
