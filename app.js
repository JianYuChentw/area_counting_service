const http = require('http');
const express = require('express');
const WebSocket = require('ws');
const cron = require('node-cron');
const session = require('express-session');  // 導入 express-session
const cors = require('cors');
require('dotenv').config(); // 使用 dotenv 讀取環境變數
const { setupWebSocket, setCacheEnabled } = require('./service/webSocket');
const router = require('./router/router');
const { checkAndInsertRegionCounters } = require('./preprocessingScript');
const port = 3100;

const app = express();

// 設置 session 中間件
app.use(session({
  secret: process.env.SECRET_KEY, // 這裡設置一個私密的字串，建議使用環境變數存放
  resave: false,             // 如果 session 沒有修改，則不會強制保存
  saveUninitialized: true,   // 如果 session 還沒有初始化，則會自動保存未初始化的 session
  cookie: {
    secure: false,           // 開發模式下設置為 false，如果是 https，則設置為 true
    maxAge: 1000 * 60 * 60 * 24 // 設置 cookie 失效時間（以毫秒為單位），這裡設置為 1 天
  }
}));

app.use(express.json());
// 動態設置 CORS
app.use(cors({
  origin: (origin, callback) => {
    // 允許所有來源，但需要具體設置 origin 而不是 '*'
    callback(null, origin || '*');  // origin 有時候可能為 null，這裡允許所有來源
  },
  credentials: true  // 允許攜帶 cookie 或其他憑證
}));

// 使用 router
app.use('/api2', router);



// 建立 HTTP 伺服器並將 Express 應用附加到伺服器
const server = http.createServer(app);

// 建立 WebSocket 伺服器並設置 WebSocket 邏輯
const wss = new WebSocket.Server({ server });
setupWebSocket(wss);

// 啟動伺服器
server.listen(port, async () => {
  console.log(`伺服器運行在 http://localhost:${port}`);
  console.log(`WebSocket 伺服器運行在 ws://localhost:${port}`);
  
  // // 伺服器首次啟動時，立即檢查並插入當日及未來 10 天的資料
  console.log('首次啟動時檢查當日及接下來十天的資料...');
  await checkAndInsertRegionCounters();
  console.log('首次檢查完成');
});

// 設定排程，每天00:01執行一次
cron.schedule('1 0 * * *', () => {
  console.log('每天 00:01 檢查並插入 region_counters 資料...');
   checkAndInsertRegionCounters();
});

cron.schedule('10 0 * * *', async() => {
  console.log('每天 00:10 重置快取並啟動服務');
  await setCacheEnabled(false);
  await setCacheEnabled(true);
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
