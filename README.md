
# 即時車輛趟次管理平台

## 簡介
以WebSocket製作即時車輛趟次管理平台旨在調控各區時段的行車預約趟次數量，提供有效的交通管理解決方案，提升運輸效率。此平台結合前後端技術，提供用戶友好的介面和高效的資料處理能力。

## 技術堆疊
- **前端**: HTML, CSS, JavaScript, Bootstrap
- **後端**: Node.js, Express Express
- **資料庫**: MySQL
- **容器化**: Docker

## 安裝與運行指南

### 前置需求
- [Node.js](https://nodejs.org/) (版本 18.16.0 或更新)
- [Docker](https://www.docker.com/) 
- [MySQL](https://www.mysql.com/) (使用 Docker 安裝)

### 安裝步驟

1. **複製專案到本地**
   ```bash
   git clone https://github.com/your-repo/area_counting_service.git
   cd area_counting_service
   ```

2. **安裝依賴**
   ```bash
   npm install
   ```

3. **設置環境變數**
   在專案目錄下建立 `.env` 檔案，並填入以下內容：
   ```bash
   DB_HOST=your_database_host
   DB_USER=your_database_user
   DB_PASSWORD=your_database_password
   DB_DATABASE=your_database_name
   DB_WAITFORCONNECTIONS=true
   DB_CONNECTIONLIMIT=10
   DB_QUEUE=true
   SECRET_KEY=your_secret_key
   ```

4. **啟動 MySQL Docker 容器**
   假設你已經配置好 Docker 的 `docker-compose.yml` 或 MySQL Docker 容器，使用以下指令來啟動：
   ```bash
   docker-compose up -d
   ```

5. **啟動應用程式**
   在專案根目錄下執行：
   ```bash
   npm start
   ```
   或者使用 Docker 啟動應用：
   ```bash
   docker build -t area_counting_service .
   docker run -p 3100:3100 area_counting_service
   ```

6. **瀏覽器訪問**
   打開瀏覽器，訪問 `http://localhost:3100` 查看應用程式。

## 主要功能
- 調控各區的時段行車預約趟次
- 即時更新車輛趟次數據
- 使用 WebSocket 進行即時通訊
- 透過 Node Cron 定時執行相關排程

## 環境變數
- `DB_HOST`: 資料庫伺服器主機
- `DB_USER`: 資料庫使用者名稱
- `DB_PASSWORD`: 資料庫密碼
- `DB_DATABASE`: 資料庫名稱
- `SECRET_KEY`: 用於安全驗證的密鑰
