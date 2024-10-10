async function fetchDailyNotifications(selectedDate) {
  try {
    // 使用選擇的日期作為 startDate 和 endDate
    const formattedDate = selectedDate; // 選擇的日期會是 YYYY-MM-DD 格式
    

    const url = `${baseUrl}/records?startDate=${formattedDate}&endDate=${formattedDate}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const notifications = await response.json();

    if (response.ok) {
      const notificationList = document.getElementById('notificationList');
      notificationList.innerHTML = ''; // 清空現有的通知列表

      notifications.forEach(notification => {
        const notificationItem = document.createElement('li');
        // 格式化推播訊息
        const formattedTime = new Date(notification.record_date).toLocaleTimeString('zh-TW', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });

        notificationItem.textContent = `${notification.content}`;
        notificationList.appendChild(notificationItem);
      });

      // 自動滾動到最底部
      const notificationArea = document.getElementById('notificationArea');
      notificationArea.scrollTop = notificationArea.scrollHeight;
    } else {
      alert('無法獲取歷史推播訊息');
    }
  } catch (error) {
    console.error('獲取歷史推播訊息時發生錯誤:', error);
  }
}

// 監聽日期下拉選擇變更事件，並根據選擇的日期來呼叫 fetchDailyNotifications
document.getElementById('dateDropdown').addEventListener('change', function () {
  const selectedDate = this.value;  // 取得選擇的日期
  fetchDailyNotifications(selectedDate);  // 呼叫 API 獲取該日期的推播訊息
});

function connectWebSocket() {
  socket = new WebSocket(sockUrl);

  const regionCounters = document.getElementById('regionCounters');
  const notificationList = document.getElementById('notificationList');
  const notificationArea = document.getElementById('notificationArea');
  const maintenanceOverlay = document.getElementById('maintenanceOverlay');

  // 檢查是否用戶正在手動滾動推播區域
  let isUserScrolling = false;

  notificationArea.addEventListener('scroll', () => {
    const { scrollTop, scrollHeight, clientHeight } = notificationArea;
    if (scrollHeight - scrollTop > clientHeight + 20) {
      isUserScrolling = true;
    } else {
      isUserScrolling = false;
    }
  });

  let userName = null;
  while (!userName) {
    userName = prompt('請輸入您的姓名：');
  }

  socket.onopen = async () => {
    console.log('已連接到 WebSocket 伺服器');
    socket.send(JSON.stringify({ type: 'nameSubmission', name: userName }));

    // 獲取當前選擇的日期，如果為空則設置為當天日期
    let selectedDate = document.getElementById('dateDropdown').value;
    if (!selectedDate) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      selectedDate = `${year}-${month}-${day}`;
    }

    // 傳送選擇的日期到服務端，請求相應的區域數據
    socket.send(JSON.stringify({ type: 'dateSelection', date: selectedDate }));

    await fetchDailyNotifications(selectedDate); // 使用選擇的日期獲取推播訊息
  };

  // 監聽日期選擇器的變更，並向服務端發送新的日期
  document.getElementById('dateDropdown').addEventListener('change', function () {
    const selectedDate = this.value;
    socket.send(JSON.stringify({ type: 'dateSelection', date: selectedDate })); // 發送新選擇的日期
  });

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);

    // 檢查服務是否正在維護中
    if (data.type === 'serviceClosed') {
      maintenanceOverlay.style.display = 'flex';  // 顯示維護提示畫面
      return;
    } else {
      maintenanceOverlay.style.display = 'none';  // 隱藏維護提示畫面
    }    
    // 如果是區域數據或計數器更新
    if (data.type === 'regionData' || data.type === 'counterUpdate') {
      // 保存滾動位置
      const scrollPosition = regionCounters.scrollTop;

      regionCounters.innerHTML = '';

      const regionMap = {};

      data.regionData.forEach(item => {
        if (!regionMap[item.area]) {
          regionMap[item.area] = [];
        }
        regionMap[item.area].push(item);
      });

      for (const [regionName, counters] of Object.entries(regionMap)) {
        const regionContainer = document.createElement('div');
        regionContainer.className = 'region-container';

        const regionTitle = document.createElement('div');
        regionTitle.className = 'region-title';
        regionTitle.innerHTML = `<h2>${regionName}</h2>`;

        const regionDiv = document.createElement('div');
        regionDiv.className = 'region';

        counters.forEach(counter => {

          const counterItem = document.createElement('div');
          counterItem.className = 'region-counter';

          // 根據趟數設定背景顏色，如果趟數為 0，設置背景為紅色，否則恢復原本顏色
          if (counter.counter_value === 0) {
            counterItem.style.backgroundColor = '#FF9797';  // 設定為紅色
          } else if (counter.counter_value === counter.max_counter_value) {
            counterItem.style.backgroundColor = '#90EEB3';
          } else {
            counterItem.style.backgroundColor = '#f9f9f9';  // 恢復為原本顏色
          }

          counterItem.innerHTML = `
            <div class="counter-details">
              <div>時間: ${counter.counter_time}</div>
              <div>趟數: ${counter.counter_value}</div>
            </div>
            <div class="btn-group">
              <button class="increment-btn btn btn-success" data-id="${counter.id}">+</button>
              <button class="decrement-btn btn btn-danger" data-id="${counter.id}">-</button>
            </div>
          `;
          regionDiv.appendChild(counterItem);
        });

        regionContainer.appendChild(regionTitle);
        regionContainer.appendChild(regionDiv);
        regionCounters.appendChild(regionContainer);
      }

      // 恢復滾動位置
      regionCounters.scrollTop = scrollPosition;

      document.querySelectorAll('.increment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const timestamp = new Date();
          const timeOnly = timestamp.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          const formattedTimestamp = new Intl.DateTimeFormat('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour12: false
          }).format(timestamp).replace(/\//g, '/').replace(',', ' -');
          socket.send(JSON.stringify({ userName: userName, type: 'action', action: 'increment', id: id, timestamp: formattedTimestamp, timeOnly: timeOnly }));
        });
      });

      document.querySelectorAll('.decrement-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const timestamp = new Date();
          const timeOnly = timestamp.toLocaleTimeString('zh-TW', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          });
          const formattedTimestamp = new Intl.DateTimeFormat('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour12: false
          }).format(timestamp).replace(/\//g, '/').replace(',', ' -');
          socket.send(JSON.stringify({ userName: userName, type: 'action', action: 'decrement', id: id, timestamp: formattedTimestamp, timeOnly: timeOnly }));
        });
      });
    }


    // 處理計數器更新推播訊息
    if (data.type === 'counterUpdate') {
      const formattedDate = new Intl.DateTimeFormat('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date()).replace(/\//g, '-').replace(',', ' -');
      if (data.changedBy) {                
        const notificationItem = document.createElement('li');
        notificationItem.textContent = `${formattedDate}/${data.timestamp} < ${data.changedBy} > - 更新 - ${data.area}/${data.date}/${data.counter_time}趟次為 ${data.counter}`;
        notificationList.appendChild(notificationItem);

        if (!isUserScrolling) {
          notificationArea.scrollTop = notificationArea.scrollHeight;
        }
      }
    }
  };

  socket.onclose = (event) => {
    // 檢查是否是維護模式（錯誤碼 1011 或連線關閉）
    if (event.code === 1011 || event.wasClean === false) {
      maintenanceOverlay.style.display = 'flex';  // 顯示維護提示畫面
    }
    console.log('WebSocket 連接已關閉');
  };

  socket.onerror = (error) => {
    console.log('WebSocket 發生錯誤', error);
    // 在錯誤發生後也可以顯示維護畫面
    maintenanceOverlay.style.display = 'flex';
  };
}




// 初始化 WebSocket 連接
connectWebSocket();

