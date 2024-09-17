const { getRegionCountersByDate } = require('../model/area');
const { validateDate, validate } = require('../utils/validator');

/**
 * 取得指定日期的區域計數器資料的控制器。
 * @async
 * @function getRegionCounters
 * @param {Object} req - Express 的請求對象，包含查詢參數 `date`。
 * @param {Object} res - Express 的回應對象，用來返回結果或錯誤訊息。
 * @returns {Promise<void>} - 當請求完成時，回應對象會返回區域計數器資料或錯誤訊息。
 * @throws {Error} - 如果發生錯誤，會返回 500 錯誤狀態碼和錯誤訊息。
 */
const getRegionCounters = async (req, res) => {
  try {
    // 從請求中取得查詢參數中的日期
    const date = req.query.date;

    // 呼叫 model 層的 getRegionCountersByDate 函數
    const counters = await getRegionCountersByDate(date);

    // 如果查無資料，返回 404
    if (!counters || counters.length === 0) {
      return res.status(404).json({ message: '無法找到對應的區域計數資料' });
    }

    // 返回資料
    res.status(200).json(counters);

  } catch (error) {
    // 如果發生錯誤，返回 500 錯誤
    console.error('取得區域計數器資料時發生錯誤:', error);
    res.status(500).json({ error: '伺服器發生錯誤，請稍後再試' });
  }
};

module.exports = {
  getRegionCounters,
};
