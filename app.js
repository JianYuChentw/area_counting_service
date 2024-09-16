const http = require('http');
const WebSocket = require('ws');
const { setupWebSocket } = require('./service/webSocket');
const port = 3000;

// 建立 HTTP 伺服器
const server = http.createServer();

// 建立 WebSocket 伺服器並設置 WebSocket 邏輯
const wss = new WebSocket.Server({ server });
setupWebSocket(wss);

// 啟動伺服器
server.listen(port, () => {
  console.log(`WebSocket 伺服器運行在 ws://localhost:${port}`);
});

// 捕捉 WebSocket 錯誤事件，避免伺服器因為 WebSocket 錯誤而崩潰
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

// 處理嚴重錯誤，避免應用突發中斷
function handleCriticalError(type, error) {
  // 記錄錯誤
  console.error(`處理 ${type} 錯誤:`, error);

  // 這裡可以加入你想要的錯誤處理邏輯，例如發送通知、記錄到文件、或重啟服務

  // 根據錯誤類型選擇是否重啟子系統或進行其他處理
  if (type === 'WebSocket' || type === 'HTTP') {
    console.log(`${type} 錯誤，繼續運行...`);
  } else {
    // 嚴重錯誤（例如未捕獲的異常），可以考慮重啟伺服器
    console.log(`嚴重錯誤發生，請檢查系統`);
    // 如果需要，可以選擇重啟服務進程
    // process.exit(1);  // 警告：這會結束進程
  }
}
