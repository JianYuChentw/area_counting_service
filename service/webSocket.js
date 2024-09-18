const { getRegionCountersByDate, regionExists } = require('../model/area'); // 引入 regionExists 函數
const { updateCounterValueById, regionCounterExists } = require('../model/timePeriod');
const { initCache, updateCache } = require('./socketCache');
const { formatTimestamp } = require('../utils/utils');
const WebSocket = require('ws');  // 確保 WebSocket 模組已正確引用
let cache = {};   // 用來儲存快取的區域數據
const clientsInfo = new Map(); // 保存每個客戶端的姓名

// 初始化快取
initCache(cache);

/**
 * 設置 WebSocket 處理邏輯，處理新連接、訊息和客戶端斷開。
 * @function setupWebSocket
 * @param {WebSocket.Server} wss - WebSocket 伺服器對象，負責管理連接的客戶端。
 */
function setupWebSocket(wss) {
  wss.on('connection', (ws) => {
    console.log('新客戶端連接');

    /**
     * 當接收到客戶端訊息時處理邏輯。
     * @event WebSocket#message
     * @param {string} message - 來自客戶端的訊息，包含操作類型和數據。
     */
    ws.on('message', async (message) => {
      const data = JSON.parse(message);

      // 處理客戶端提交姓名的訊息
      if (data.type === 'nameSubmission') {
        clientsInfo.set(ws, data.name);

        // 發送快取中的區域數據給客戶端
        const cachedData = cache['2024-09-01'];
        ws.send(JSON.stringify({
          type: 'regionData',
          regionData: cachedData,
          status: 200
        }));
        return;
      }

      const userName = clientsInfo.get(ws);
      if (!userName) {
        ws.send(JSON.stringify({
          type: 'error',
          message: '請先提交您的姓名',
          status: 400
        }));
        return;
      }

      // 根據客戶端操作進行計數器值的更新
      if (data.type === 'action') {
        const { id, action } = data;

        // 檢查區域 ID 是否存在
        const exists = await regionCounterExists(id);
        if (!exists) {
          ws.send(JSON.stringify({
            type: 'error',
            message: `區域 ID ${id} 不存在`,
            status: 404
          }));
          return;
        }

        const regionData = cache['2024-09-01'].find(item => item.id === parseInt(id));
        const { area, counter_time } = regionData;

        let updatedCounterValue;
        // 根據操作類型增減計數器值
        if (action === 'increment') {
          updatedCounterValue = await updateCounterValueById(id, 'increment');
        } else if (action === 'decrement') {
          updatedCounterValue = await updateCounterValueById(id, 'decrement');
        } else {
          // 如果操作類型無效，回傳錯誤
          ws.send(JSON.stringify({
            type: 'error',
            message: '無效的操作類型',
            status: 400
          }));
          return;
        }

        // 如果更新成功，更新快取並廣播結果
        if (updatedCounterValue !== false) {
          cache = await updateCache('2024-09-01', cache);

          // 廣播更新結果給所有已連接的客戶端
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'counterUpdate',
                area,
                counter_time,
                counter: updatedCounterValue,
                changedBy: userName,
                timestamp: formatTimestamp(data.timestamp),
                regionData: cache['2024-09-01'],
                status: 200
              }));
            }
          });
        } else {
          // 如果更新失敗（例如超出範圍），回傳錯誤訊息
          ws.send(JSON.stringify({
            type: 'error',
            message: '更新失敗，超出設定趟次範圍',
            status: 403
          }));
        }
      }
    });

    /**
     * 當客戶端斷開連接時清理資料。
     * @event WebSocket#close
     */
    ws.on('close', () => {
      console.log('客戶端斷開連接');
      clientsInfo.delete(ws);
    });
  });
}

module.exports = { setupWebSocket };
