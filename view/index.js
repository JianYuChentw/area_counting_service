// 建立 WebSocket 連接到伺服器
const socket = new WebSocket('ws://localhost:3000');

const regionCounters = document.getElementById('regionCounters');
const notificationList = document.getElementById('notificationList');
const notificationArea = document.getElementById('notificationArea');

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

socket.onopen = () => {
  console.log('已連接到 WebSocket 伺服器');
  socket.send(JSON.stringify({ type: 'nameSubmission', name: userName }));
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // 如果有 status 欄位並且狀態碼不是 200，則彈出提示框
  if (data.status && data.status !== 200) {
    alert(`操作失敗：${data.message || '未知錯誤'}`);
    return;
  }

  // 如果是區域數據或計數器更新
  if (data.type === 'regionData' || data.type === 'counterUpdate') {
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
        counter.max_counter_value

        // 根據趟數設定背景顏色，如果趟數為 0，設置背景為紅色，否則恢復原本顏色
        if (counter.counter_value === 0) {
          counterItem.style.backgroundColor = '#FF9797';  // 設定為紅色
        } else if(counter.counter_value === counter.max_counter_value){
          counterItem.style.backgroundColor = '#90EEB3'
        } else {
          counterItem.style.backgroundColor = '#f9f9f9';  // 恢復為原本顏色
        }

        counterItem.innerHTML = `
          <div class="counter-details">
            <div>時間: ${counter.counter_time}</div>
            <div>趟數: ${counter.counter_value}</div>
          </div>
          <div class="counter-controls">
            <button class="increment-btn" data-id="${counter.id}">+</button>
            <button class="decrement-btn" data-id="${counter.id}">-</button>
          </div>
        `;
        regionDiv.appendChild(counterItem);
      });

      regionContainer.appendChild(regionTitle);
      regionContainer.appendChild(regionDiv);
      regionCounters.appendChild(regionContainer);
    }

    document.querySelectorAll('.increment-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const timestamp = new Date();
        const formattedTimestamp = new Intl.DateTimeFormat('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(timestamp).replace(/\//g, '/').replace(',', ' -');
        socket.send(JSON.stringify({userName: userName, type: 'action', action: 'increment', id: id, timestamp: formattedTimestamp }));
      });
    });

    document.querySelectorAll('.decrement-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const timestamp = new Date();
        const formattedTimestamp = new Intl.DateTimeFormat('zh-TW', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        }).format(timestamp).replace(/\//g, '/').replace(',', ' -');
        socket.send(JSON.stringify({userName: userName, type: 'action', action: 'decrement', id: id, timestamp: formattedTimestamp }));
      });
    });
  }

  // 處理計數器更新推播訊息
  if (data.type === 'counterUpdate') {
    if (data.changedBy) {
      
      const notificationItem = document.createElement('li');
      notificationItem.textContent = `${data.timestamp.split(' - ')[1].substring(0, 5)} < ${data.changedBy} > - 更新 - ${data.area}/${data.counter_time}趟次為 ${data.counter}`;
      notificationList.appendChild(notificationItem);

      if (!isUserScrolling) {
        notificationArea.scrollTop = notificationArea.scrollHeight;
      }
    }
  }
};

socket.onclose = () => {
  console.log('WebSocket 連接已關閉');
};

socket.onerror = (error) => {
  console.log('WebSocket 發生錯誤', error);
};
