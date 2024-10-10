const { getRegionCountersByDate, regionExists } = require('../model/area');
const { updateAreaCounterValueById, areaRegionCounterExists } = require('../model/areaTimePeriod');
const { initCache, updateCache } = require('./socketCache');
const{ addRecord, getRecordsByConditions, deleteRecord } = require('../model/operateRecords')
const { formatTimestamp,formatToDate,getTaiwanDate } = require('../utils/utils');
const WebSocket = require('ws');


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
      ws.close(1011, '服務目前關閉，正在維護中');
      return;
    }

    console.log('新客戶端連接');

    ws.on('message', async (message) => {
      const data = JSON.parse(message);

      // 處理客戶端提交的姓名訊息
      if (data.type === 'nameSubmission') {
        clientsInfo.set(ws, data.name);

        // 預設傳遞當日的快取區域數據
        const todayInTaiwan = getTaiwanDate();
        const cachedData = cache[todayInTaiwan];

        if (cachedData) {
          ws.send(JSON.stringify({
            type: 'regionData',
            regionData: cachedData,
            status: 200
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: '目前沒有可用的快取資料',
            status: 404
          }));
        }
        return;
      }

      // 根據前端選取的日期返回區域計數器資料
      if (data.type === 'dateSelection') {
        const selectedDate = data.date; 
        
        // 檢查快取是否存在選取日期的數據
        const cachedData = cache[selectedDate];
        if (cachedData) {
          ws.send(JSON.stringify({
            type: 'regionData',
            regionData: cachedData,
            status: 200
          }));
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: `該日期 (${selectedDate}) 沒有可用的快取資料`,
            status: 404
          }));
        }
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
        const dataDate = new Date(exists.date).toLocaleDateString('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).replace(/\//g, '-');

        const regionData = cache[dataDate];

        if (!regionData) {
          ws.send(JSON.stringify({
            type: 'error',
            message: '目前尚未服務，請稍後再試',
            status: 404
          }));
          return;
        }

        const targetRegion = regionData.find(item => item.id === parseInt(id));
        if (!targetRegion) {
          ws.send(JSON.stringify({
            type: 'error',
            message: `無法找到 ID 為 ${id} 的區域數據`,
            status: 404
          }));
          return;
        }
        
        const { area, counter_time, counter_value, max_counter_value } = targetRegion;

        let updatedCounterValue;
        if (action === 'increment') {
          const content = `${formatToDate(data.timestamp)}/${data.timeOnly} < ${data.userName} > - 更新 - ${area}/${dataDate}/${counter_time}趟次為 ${counter_value+1}`;
          if (counter_value + 1 <= max_counter_value) {
            addRecord(formatToDate(data.timestamp), dataDate, counter_time, content);
          }
          updatedCounterValue = await updateAreaCounterValueById(id, 'increment');
        } else if (action === 'decrement') {
          const content = `${formatToDate(data.timestamp)}/${data.timeOnly} < ${data.userName} > - 更新 - ${area}/${dataDate}/${counter_time}趟次為 ${counter_value-1}`;
          if (counter_value - 1 >= 0) {
            addRecord(formatToDate(data.timestamp), dataDate,  counter_time, content);
          } 
          updatedCounterValue = await updateAreaCounterValueById(id, 'decrement');
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: '無效的操作類型',
            status: 400
          }));
          return;
        }

        if (updatedCounterValue !== false) {
          cache = await updateCache(dataDate, cache);

          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {

              client.send(JSON.stringify({
                type: 'counterUpdate',
                area,
                counter_time,
                counter: updatedCounterValue,
                changedBy: userName,
                date:data.timestamp,
                timestamp: data.timeOnly,
                regionData: cache[dataDate],
                status: 200
              }));
            }
          });
        } else {
          ws.send(JSON.stringify({
            type: 'error',
            message: '更新失敗，超出設定趟次範圍',
            status: 403
          }));
        }
      }
    });

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
