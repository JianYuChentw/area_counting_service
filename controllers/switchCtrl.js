const { getCacheStatus, setCacheEnabled } = require('../service/webSocket'); // 確保這裡的路徑正確

/**
 * 取得目前的快取開關狀態
 * @param {Request} req - Express Request 對象
 * @param {Response} res - Express Response 對象
 */
const getCacheSwitchStatus = (req, res) => {
  const status = getCacheStatus();
  res.status(200).json({ cacheEnabled: status });
};

/**
 * 更新快取開關狀態
 * @param {Request} req - Express Request 對象
 * @param {Response} res - Express Response 對象
 */
const updateCacheSwitchStatus = (req, res) => {
  const { enabled } = req.body;
  
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: '無效的 "enabled" 值。必須是一個布林值（true 或 false）。' });
  }

  setCacheEnabled(enabled);
  res.status(200).json({ message: `快取已經${enabled ? '開啟' : '關閉'}。`, cacheEnabled: enabled });
};

module.exports = { getCacheSwitchStatus, updateCacheSwitchStatus };
