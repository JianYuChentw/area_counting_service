document
  .getElementById('areaManagementBtn')
  .addEventListener('click', function () {
    window.location.href = './backstage.html'; // 目標頁面
  });

document
  .getElementById('timePeriodTripsManagementBtn')
  .addEventListener('click', function () {
    window.location.href = './areaTimePeriod.html'; // 目標頁面
  });

document.getElementById('recordsBtn').addEventListener('click', function () {
  window.location.href = './recordsPage.html'; // 目標頁面
});

// 獲取指定日期的前後三天範圍，使用台北時間（UTC+8）為基準
function getDateRange() {
  // 獲取當前台北時間
  const today = new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' });
  const todayDate = new Date(today);

  // 獲取三天前的日期
  const startDate = new Date(todayDate);
  startDate.setDate(todayDate.getDate() - 3);

  // 獲取三天後的日期
  const endDate = new Date(todayDate);
  endDate.setDate(todayDate.getDate() + 3);

  // 格式化日期為 YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split('T')[0];

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate),
  };
}

async function fetchRegionCounters() {
  const { startDate, endDate } = getDateRange(); // 動態獲取台北時間下的前後三天
  const response = await fetch(
    `${baseUrl}/region_counter?startDate=${startDate}&endDate=${endDate}`
  );
  const data = await response.json();
  return data;
}

// 發送更新請求到後端 API，更新指定日期和區域的 state
async function updateState(date, region_id, newState) {
  const url = region_id
    ? `${baseUrl}/update_state?date=${date}&region_id=${region_id}&state=${newState}`
    : `${baseUrl}/update_state?date=${date}&state=${newState}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
    });

    // 檢查 API 回應狀態
    if (response.status === 503) {
      const message = await response.json();
      alert(`${message.message}`); // 顯示服務不可用的消息
      return false; // 返回 false 表示更新失敗
    }

    if (response.status === 200) {
      const result = await response.json();
      return true; // 返回 true 表示更新成功
    } else {
      const errorData = await response.json();
      console.error('更新失敗:', errorData);
      return false; // 返回 false 表示更新失敗
    }
  } catch (error) {
    console.error('更新區域 state 時發生錯誤:', error);
    return false; // 返回 false 表示更新失敗
  }
}

// 發送更新請求到後端 API，更新整個日期的所有區域 state
async function updateAllStates(date, newState) {
  const success = await updateState(date, null, newState);
  return success;
}

async function init() {
  const regionData = await fetchRegionCounters();
  const regionAccordion = document.getElementById('regionAccordion');

  // 遍歷日期
  let index = 0; // 用來給每個 accordion item 唯一的 ID
  for (const [date, regions] of Object.entries(regionData)) {
    index++;
    const collapseId = `collapse-${index}`;
    const headingId = `heading-${index}`;
    let allOn = regions.every((region) => region.state === 1); // 判斷該日期下所有區域是否都為 ON

    // 創建 accordion item 結構
    const accordionItem = document.createElement('div');
    accordionItem.classList.add('accordion-item');

    const header = `
            <h2 class="accordion-header" id="${headingId}">
                <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="true" aria-controls="${collapseId}">
                    ${date}
                </button>
            </h2>
        `;

    const body = document.createElement('div');
    body.classList.add('accordion-collapse', 'collapse');
    body.id = collapseId;
    body.setAttribute('aria-labelledby', headingId);
    body.setAttribute('data-bs-parent', '#regionAccordion');

    const bodyContent = document.createElement('div');
    bodyContent.classList.add('accordion-body');

    // 創建全局控制所有區域 state 的開關（form-switch）
    const globalSwitchDiv = document.createElement('div');
    globalSwitchDiv.classList.add('form-check', 'form-switch', 'mb-3');

    const globalSwitchLabel = document.createElement('label');
    globalSwitchLabel.classList.add('form-check-label');
    globalSwitchLabel.setAttribute('for', `global-switch-${date}`);
    globalSwitchLabel.textContent = allOn ? '全部關閉' : '全部開啟';

    const globalSwitch = document.createElement('input');
    globalSwitch.classList.add('form-check-input');
    globalSwitch.type = 'checkbox';
    globalSwitch.role = 'switch';
    globalSwitch.id = `global-switch-${date}`;
    globalSwitch.checked = allOn;

    // 為全局開關綁定事件
    globalSwitch.addEventListener('change', async () => {
      const newState = globalSwitch.checked ? 1 : 0;
      const success = await updateAllStates(date, newState);

      // 檢查是否成功，如果失敗則恢復開關狀態
      if (!success) {
        globalSwitch.checked = !globalSwitch.checked; // 恢復到之前的狀態
        return; // 如果失敗，不繼續更新區域的開關狀態
      }

      // 更新所有區域的開關狀態
      regions.forEach((region) => {
        const checkbox = document.querySelector(
          `#region-${date}-${region.region_id}`
        );
        checkbox.checked = newState === 1;
      });

      // 更新全局開關的標籤
      globalSwitchLabel.textContent = newState === 1 ? '全部關閉' : '全部開啟';
    });

    // 將全局開關和標籤添加到 DOM
    globalSwitchDiv.appendChild(globalSwitch);
    globalSwitchDiv.appendChild(globalSwitchLabel);
    bodyContent.appendChild(globalSwitchDiv);

    // 使用 Bootstrap 的 row 來包裝列
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('row', 'mt-3');

    // 遍歷該日期下的區域，每個區域使用 col 包裝
    regions.forEach((region) => {
      const colDiv = document.createElement('div');
      colDiv.classList.add('col-md-2', 'mb-3'); // 每行最多五列，每列間隔

      const regionDiv = document.createElement('div');
      regionDiv.classList.add('region');

      const label = document.createElement('label');
      label.setAttribute('for', `region-${date}-${region.region_id}`);
      label.textContent = `${region.region_area}`;

      // 使用 Bootstrap 的 form-switch 元件
      const switchDiv = document.createElement('div');
      switchDiv.classList.add('form-check', 'form-switch');

      const checkbox = document.createElement('input');
      checkbox.classList.add('form-check-input');
      checkbox.type = 'checkbox';
      checkbox.role = 'switch';
      checkbox.id = `region-${date}-${region.region_id}`;
      checkbox.checked = region.state === 1;

      // 為單個區域的 checkbox 綁定事件，更新該區域的 state
      checkbox.addEventListener('change', async () => {
        const newState = checkbox.checked ? 1 : 0;
        const success = await updateState(date, region.region_id, newState);

        // 檢查是否成功，如果失敗則恢復開關狀態
        if (!success) {
          checkbox.checked = !checkbox.checked; // 恢復到之前的狀態
        }
      });

      switchDiv.appendChild(checkbox);
      switchDiv.appendChild(label);
      colDiv.appendChild(switchDiv); // 將 switch 放入 col
      rowDiv.appendChild(colDiv); // 將每個區域添加到列中
    });

    bodyContent.appendChild(rowDiv); // 將整個 row 添加到 bodyContent 中
    body.appendChild(bodyContent);

    // 將 header 和 body 加入到 accordion item
    accordionItem.innerHTML = header;
    accordionItem.appendChild(body);

    // 加入到 accordion 容器
    regionAccordion.appendChild(accordionItem);
  }
}

// 初始化頁面
init();
