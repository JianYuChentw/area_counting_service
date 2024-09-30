// const baseUrl = 'http://localhost:3100/api2'; // 伺服器基礎 URL

const baseUrl = 'http://3.27.140.23/api2'; // 修改為雲端伺服器基礎 URL

// 當按鈕被點擊時，跳轉到目標頁面
document.getElementById('areaManagementBtn').addEventListener('click', function() {
    window.location.href = './backstage.html';  // 目標頁面
  });

  document.getElementById('recordsBtn').addEventListener('click', function() {
    window.location.href = './recordsPage.html';  // 目標頁面
  });
  
// 獲取當前系統日期並格式化為 YYYY/MM/DD
const currentDate = new Date();
const formattedCurrentDate = currentDate.toISOString().split('T')[0].replace(/-/g, '/');

// 模擬未來10天的日期選項
const dateOptions = Array.from({ length: 10 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() + i);  // 往後推i天
  return date.toISOString().split('T')[0].replace(/-/g, '/');
});

// 初始化日期下拉選單
const dateSelector = document.getElementById('dateSelector');
dateOptions.forEach(date => {
  const option = document.createElement('option');
  option.value = date;
  option.textContent = date;
  if (date === formattedCurrentDate) {
    option.selected = true; // 設置預設為當日
  }
  dateSelector.appendChild(option);
});

// 獲取區域資料並填充到下拉選單
function loadRegions() {
  const selectedDate = dateSelector.value; // 取得目前選擇的日期
  const regionSelect = document.getElementById('regionSelect');

  fetch(`${baseUrl}/single_day_area_name?date=${selectedDate}`) // 使用帶日期參數的API
    .then(response => response.json())
    .then(regions => {
      // 清空之前的選項
      regionSelect.innerHTML = '';

      // 根據回傳資料填充選項
      regions.forEach(region => {
        const option = document.createElement('option');
        option.value = region.id; // 使用區域的ID作為選項的值
        option.textContent = region.area; // 顯示區域的名稱
        regionSelect.appendChild(option);
      });
    })
    .catch(error => {
      console.error('Error fetching regions from API:', error);
    });
}

// 根據選擇的日期從 API 獲取資料並渲染頁面
function fetchAndRenderData(date) {
  const apiUrl = `${baseUrl}/single_day_area_counter?date=${date}`;
  // 清空舊的渲染內容
  const regionCounters = document.getElementById('regionCounters');
  regionCounters.innerHTML = '';  // 每次先清空區域內容

  fetch(apiUrl)
    .then(response => {
      if (response.status === 404) {
        // 如果伺服器回應 404，顯示「無資料」的提示
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-message';
        emptyMessage.textContent = '無法找到對應的區域計數資料';
        regionCounters.appendChild(emptyMessage);
        return null; // 直接返回 null，跳過後續處理
      } else if (!response.ok) {
        throw new Error(`伺服器錯誤，狀態碼: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      if (!data) return; // 如果前面返回 null，則跳過渲染

      // 按區域進行分組
      const groupedData = data.reduce((acc, item) => {
        if (!acc[item.area]) {
          acc[item.area] = [];
        }
        acc[item.area].push(item);
        return acc;
      }, {});

      // 根據時間進行排序
      for (const area in groupedData) {
        groupedData[area].sort((a, b) => {
          return a.counter_time.localeCompare(b.counter_time);
        });
      }

      // 渲染新的資料
      for (const [area, counters] of Object.entries(groupedData)) {
        // 創建區域容器
        const regionContainer = document.createElement('div');
        regionContainer.className = 'region-container';

        // 區域標題
        const regionTitle = document.createElement('div');
        regionTitle.className = 'region-title';
        regionTitle.innerHTML = `<h2>${area}</h2>`;

        regionContainer.appendChild(regionTitle);

        // 計數器內容
        counters.forEach(counter => {
          const counterItem = document.createElement('div');
          counterItem.className = 'region-counter';

          // 計數器詳細內容，顯示 max_counter_value 而非 counter_value
          counterItem.innerHTML = `
            <div class="counter-details">
              <div>時間: ${counter.counter_time}</div>
              <div>最大趟數: ${counter.max_counter_value}</div>
            </div>
            <div class="counter-controls btn-group" role="group" aria-label="Basic mixed styles example">
              <button class="increment-btn btn btn-success" data-id="${counter.id}" data-area="${area}" data-counter_time="${counter.counter_time}">+</button>
              <button class="decrement-btn btn btn-warning" data-id="${counter.id}" data-area="${area}" data-counter_time="${counter.counter_time}">-</button>
              <button class="delete-btn btn btn-danger" data-id="${counter.id}" data-area="${area}" data-counter_time="${counter.counter_time}" >刪除</button>
            </div>
          `;

          regionContainer.appendChild(counterItem);
        });

        regionCounters.appendChild(regionContainer);
      }
    })
    .catch(error => {
      console.error('Error fetching data from API:', error);
      const errorMessage = document.createElement('div');
      errorMessage.className = 'error-message';
      errorMessage.textContent = '伺服器發生錯誤，請稍後再試';
      regionCounters.appendChild(errorMessage);
    });
}



// 使用事件代理來處理按鈕事件，防止多次綁定
document.getElementById('regionCounters').addEventListener('click', (event) => {
  const id = event.target.getAttribute('data-id');
  const area = event.target.getAttribute('data-area'); 
  const counter_time = event.target.getAttribute('data-counter_time'); 
  
  if (event.target.classList.contains('increment-btn')) {
    updateCounter(id, 'increment', area, counter_time);
  } else if (event.target.classList.contains('decrement-btn')) {
    updateCounter(id, 'decrement', area, counter_time);
  } else if (event.target.classList.contains('delete-btn')) {
    deleteCounter(id, area, counter_time);
  }
});

// 更新計數器值並提示操作結果
async function updateCounter(id, operation, area, counter_time) {
  try {
    const response = await fetch(`${baseUrl}/update_region_counter/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ operation })
    });

    const result = await response.json();

    if (response.ok) {
      alert(`區域「${area}/${counter_time}」的計數器已成功 ${operation === 'increment' ? '增加' : '減少'}。`);
      fetchAndRenderData(dateSelector.value); // 重新加載資料
    } else if (response.status === 503) {
      alert('服務中，無法進行操作。');
    } else {
      alert(result.message || '操作失敗');
    }
  } catch (error) {
    console.error('更新計數器失敗:', error);
    alert('更新失敗，請稍後再試');
  }
}


// 刪除計數器並提示操作結果
async function deleteCounter(id, area, counter_time) {
  try {
    const response = await fetch(`${baseUrl}/delete_region_counter/${id}`, {
      method: 'DELETE'
    });

    const result = await response.json();

    if (response.ok) {
      alert(`區域「${area}/${counter_time}」的計數器已成功刪除。`);
      fetchAndRenderData(dateSelector.value); // 重新載入資料
    } else if (response.status === 503) {
      alert('服務中，無法進行刪除操作。');
    } else {
      alert(result.message || '刪除失敗');
    }
  } catch (error) {
    console.error('刪除計數器過程中發生錯誤:', error);
    alert('刪除失敗，請稍後再試');
  }
}


// 新增區域時段計數器
document.getElementById('addCounterBtn').addEventListener('click', async () => {
  const regionId = document.getElementById('regionSelect').value;
  const regionName = document.getElementById('regionSelect').selectedOptions[0].textContent; // 取得區域名稱
  const counterTime = document.getElementById('counterTime').value;
  const maxCounterValue = document.getElementById('maxCounterValue').value;

  if (!regionId || !counterTime || !maxCounterValue) {
    alert('請完整填寫所有欄位');
    return;
  }

  const data = {
    region_id: regionId,
    counter_time: counterTime,
    date: dateSelector.value,
    max_counter_value: maxCounterValue
  };

  try {
    const response = await fetch(`${baseUrl}/add_region_counter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      alert(`區域「${regionName}」的計數器已成功新增。`);
      fetchAndRenderData(dateSelector.value);  // 新增後重新載入數據
    } else if (response.status === 409) {
      alert(result.message || '該時段已存在');
    } else if (response.status === 503) {
      alert('服務中，無法進行新增操作。');
    } else {
      alert('伺服器錯誤，請稍後再試');
    }
  } catch (error) {
    console.error('新增計數器過程中發生錯誤:', error);
    alert(error.message || '新增失敗，請稍後再試');
  }
});

  

// 初始載入當前日期的資料和區域列表
fetchAndRenderData(formattedCurrentDate);
loadRegions();  // 載入區域資料

// 監聽日期選擇器的變更事件
dateSelector.addEventListener('change', (event) => {
  fetchAndRenderData(event.target.value);
  loadRegions();  // 日期變更時重新載入區域資料
});
