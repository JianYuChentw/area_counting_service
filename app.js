const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const { setupWebSocket } = require('./service/webSocket');
const router = require('./router/router');
const port = 3000;

const app = express();

app.use(express.json());

// 使用 router
app.use('/', router);


// 建立 HTTP 伺服器並將 Express 應用附加到伺服器
const server = http.createServer(app);

// 建立 WebSocket 伺服器並設置 WebSocket 邏輯
const wss = new WebSocket.Server({ server });
setupWebSocket(wss);

// 啟動伺服器
server.listen(port, () => {
  console.log(`伺服器運行在 http://localhost:${port}`);
  console.log(`WebSocket 伺服器運行在 ws://localhost:${port}`);
});

// 捕捉 WebSocket 錯誤事件
wss.on('error', (err) => {
  console.error('WebSocket 伺服器錯誤:', err);
  handleCriticalError('WebSocket', err);
});

// 捕捉 HTTP 伺服器錯誤事件
server.on('error', (err) => {
  console.error('HTTP 伺服器錯誤:', err);
  handleCriticalError('HTTP', err);
});

// 全局未捕獲的異常處理
process.on('uncaughtException', (err) => {
  console.error('未捕獲的異常:', err);
  handleCriticalError('UncaughtException', err);
});

// 全局未處理的 Promise 拒絕處理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未處理的 Promise 拒絕:', reason);
  handleCriticalError('UnhandledRejection', reason);
});

// 處理嚴重錯誤
function handleCriticalError(type, error) {
  console.error(`處理 ${type} 錯誤:`, error);
  
  // 根據錯誤類型選擇是否繼續運行或停止服務
  if (type === 'WebSocket' || type === 'HTTP') {
    console.log(`${type} 錯誤，伺服器繼續運行...`);
  } else {
    console.log('嚴重錯誤發生，停止運行...');
    process.exit(1);  // 停止服務
  }
}
