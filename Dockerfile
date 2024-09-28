# 使用 Node.js 18 作為基礎映像
FROM node:18

# 設定工作目錄
WORKDIR /app

COPY package*.json ./

# 安裝依賴，這部分通常不會頻繁改動
RUN npm install --production

# 複製專案的其餘文件
COPY . .

# 允許 Docker 曝露應用程序的端口
EXPOSE 3100

# 啟動應用程序
CMD ["npm", "start"]
