const { getRegionCountersByDate, regionExists } = require('../model/area');
const { updateAreaCounterValueById, areaRegionCounterExists } = require('../model/areaTimePeriod');
const { initCache, updateCache } = require('./socketCache');
const { formatTimestamp } = require('../utils/utils');
const WebSocket = require('ws'); 
const { getTaiwanDate } = require('../utils/utils');

let cache = {};   // 用來儲存快取的區域數據
const clientsInfo = new Map(); // 保存每個客戶端的姓名
let cacheEnabled = true;  // 開關，決定是否傳遞快取資料

// 初始化快取
initCache(cache);

/**
 * 設置 WebSocket 處理邏輯，處理新連接、訊息和客戶端斷開。
 * @function setupWebSocket
 * @param {WebSocket.Server} wss - WebSocket 伺服器對象，負責管理連接的客戶端。
 */
function setupWebSocket(wss) {
  wss.on('connection', (ws) => {
    // 檢查服務是否正在維護中
    if (!cacheEnabled) {
      // 服務維護中，關閉連接
      ws.close(1011, '服務目前關閉，正在維護中');  // 1011 是標準的 WebSocket 錯誤碼，用於服務端異常關閉
      return;
    }

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

        // 傳遞快取中的區域數據給客戶端
        const todayInTaiwan = getTaiwanDate();
        const cachedData = cache[todayInTaiwan];
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
        const exists = await areaRegionCounterExists(id);
        if (!exists) {
          ws.send(JSON.stringify({
            type: 'error',
            message: `區域 ID ${id} 不存在`,
            status: 404
          }));
          return;
        }
        
        const todayInTaiwan = getTaiwanDate();
        const regionData = cache[todayInTaiwan].find(item => item.id === parseInt(id));
        const { area, counter_time } = regionData;

        let updatedCounterValue;
        // 根據操作類型增減計數器值
        if (action === 'increment') {

          // TODO:操作紀錄
          console.log(data);
          
          updatedCounterValue = await updateAreaCounterValueById(id, 'increment');
        } else if (action === 'decrement') {

          console.log(data);
          updatedCounterValue = await updateAreaCounterValueById(id, 'decrement');
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
          cache = await updateCache(todayInTaiwan, cache);

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
                regionData: cache[todayInTaiwan],
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

/**
 * 設置快取是否啟用的開關。
 * @function setCacheEnabled
 * @param {boolean} enabled - 布林值，決定是否啟用快取。
 */
async function setCacheEnabled(enabled) {
  cacheEnabled = enabled;

  if (enabled) {
    const todayInTaiwan = getTaiwanDate();
    // 獲取當天的區域計數資料並加入快取
    const regionCounters = await getRegionCountersByDate(todayInTaiwan);
    
    // 將獲取到的資料加入快取中
    cache[todayInTaiwan] = regionCounters; 
    console.log(`快取已啟用，當天區域計數資料已加入快取：`);
  } else {
    // 關閉快取時清空快取
    cache = {};
    console.log('快取已關閉，所有快取資料已被清除。');
  }
}

/**
 * 取得目前快取的開關狀態。
 * @function getCacheStatus
 * @returns {boolean} - 回傳當前的快取啟用狀態。
 */
function getCacheStatus() {
  return cacheEnabled;
}

module.exports = { setupWebSocket, setCacheEnabled, getCacheStatus };
