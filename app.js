const http = require('http');
const WebSocket = require('ws');
const { getRegionCountersByDate, updateCounterValueById } = require("./model/area"); // 引入之前的函數
const port = 3000;
let cache = {};   // 用來儲存快取的區域數據

// 用來保存每個客戶端的姓名
const clientsInfo = new Map();

// 建立 HTTP 伺服器
const server = http.createServer();

// 建立 WebSocket 伺服器
const wss = new WebSocket.Server({ server });

// 初始化快取
async function initCache() {
  const regionData = await getRegionCountersByDate('2024-09-01');  // 獲取該日期的數據
  cache['2024-09-01'] = regionData; // 保存到快取
  console.log('快取初始化完成', cache);
}

// 初始化快取
initCache();

// 格式化時間戳，將其轉換為 yyyy/mm/dd - hh:mm:ss 24 小時格式
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}/${month}/${day} - ${hours}:${minutes}:${seconds}`;
}

// 當有客戶端連接到 WebSocket 伺服器時觸發
wss.on('connection', (ws) => {
  console.log('新客戶端連接');

  // 當接收到客戶端的訊息時觸發
  ws.on('message', async (message) => {
    const data = JSON.parse(message);

    // 如果客戶端第一次連接，則儲存它的名字並返回快取中的區域數據
    if (data.type === 'nameSubmission') {
      clientsInfo.set(ws, data.name);
      
      // 發送快取中的區域數據給客戶端
      const cachedData = cache['2024-09-01'];
      ws.send(JSON.stringify({
        type: 'regionData',
        regionData: cachedData
      }));
      return;
    }

    // 檢查客戶端是否已經提交了名字
    const userName = clientsInfo.get(ws);
    if (!userName) {
      ws.send(JSON.stringify({ type: 'error', message: '請先提交您的姓名' }));
      return;
    }

    // 根據客戶端發送的動作更新計數器
    if (data.type === 'action') {
      const { id, action } = data; // 從請求中獲取 id 和操作類型
      let updatedCounterValue;

      // 找到對應的區域和時間信息
      const regionData = cache['2024-09-01'].find(item => item.id === parseInt(id));
      const { area, counter_time } = regionData;

      if (action === 'increment') {
        console.log('計數器增加');
        updatedCounterValue = await updateCounterValueById(id, 'increment');
        cache['2024-09-01'] = await getRegionCountersByDate('2024-09-01');  // 更新快取
      } else if (action === 'decrement') {
        console.log('計數器減少');
        updatedCounterValue = await updateCounterValueById(id, 'decrement');
        cache['2024-09-01'] = await getRegionCountersByDate('2024-09-01');  // 更新快取
      }

      // 廣播更新的計數器值、區域、時間和格式化後的時間戳給所有客戶端
      ;
      wss.clients.forEach(client => {

        if (client.readyState === WebSocket.OPEN) {
          
          client.send(JSON.stringify({
            type: 'counterUpdate',
            area,  // 傳送區域名稱
            counter_time,  // 傳送計數時間
            counter: updatedCounterValue,  // 異動後的計數值
            changedBy: userName,  // 傳送異動計數器的客戶端姓名
            timestamp: formatTimestamp(data.timestamp),  // 使用格式化後的時間戳
            regionData: cache['2024-09-01']  // 從快取中取最新的區域數據
          }));
        }
      });
    }
  });

  // 當連接關閉時觸發
  ws.on('close', () => {
    console.log('客戶端斷開連接');
    clientsInfo.delete(ws);  // 移除已斷開連接的客戶端信息
  });
});

// 啟動伺服器
server.listen(port, () => {
  console.log(`WebSocket 伺服器運行在 ws://localhost:${port}`);
});
