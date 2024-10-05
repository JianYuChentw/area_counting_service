// 動態生成當天及前三天的日期選項
const dateSelect = document.getElementById('dateSelect');
const today = new Date();

document
  .getElementById('timePeriodTripsManagementBtn')
  .addEventListener('click', function () {
    window.location.href = './areaTimePeriod.html'; // 目標頁面
  });

document
  .getElementById('areaManagementBtn')
  .addEventListener('click', function () {
    window.location.href = './backstage.html'; // 目標頁面
  });

// 生成當天及前三天和後三天的日期
for (let i = -3; i <= 3; i++) {
  const date = new Date(); // 以當前日期為基準
  date.setDate(date.getDate() + i); // 計算前後的天數
  const formattedDate = date.toISOString().split('T')[0]; // 格式化為 YYYY-MM-DD

  const option = document.createElement('option');
  option.value = formattedDate;
  option.textContent = formattedDate;
  dateSelect.appendChild(option);
}


// 生成時間選擇下拉選單，範圍 08:00 - 18:00，每 30 分鐘一個選項
const timeSelect = document.getElementById('timeSelect');
for (let hour = 8; hour <= 18; hour++) {
  for (let minute = 0; minute < 60; minute += 30) {
    const timeOption = document.createElement('option');
    const formattedTime = `${String(hour).padStart(2, '0')}:${String(
      minute
    ).padStart(2, '0')}`;
    timeOption.value = formattedTime;
    timeOption.textContent = formattedTime;
    timeSelect.appendChild(timeOption);
  }
}

// 發送篩選請求
document.getElementById('filterButton').addEventListener('click', () => {
  const selectedDate = document.getElementById('dateSelect').value;
  const selectedTime = document.getElementById('timeSelect').value;

  let apiUrl = `${baseUrl}/records`;

  // 添加查詢參數
  const params = [];
  if (selectedDate) {
    params.push(`startDate=${selectedDate}&endDate=${selectedDate}`);
  }
  if (selectedTime) {
    params.push(`timePeriod=${selectedTime}`);
  }

  if (params.length > 0) {
    apiUrl += '?' + params.join('&');
  }

  // 發送請求並更新表格
  fetch(apiUrl)
    .then((response) => response.json())
    .then((data) => {
      const tableBody = document.getElementById('recordsTableBody');

      // 清空表格內容
      tableBody.innerHTML = '';

      // 將每筆記錄添加到表格中
      data.forEach((record) => {
        const row = document.createElement('tr');   

        row.innerHTML = `
                        <td>${new Date(
                          record.record_date
                        ).toLocaleDateString()}</td>
                        <td>${new Date(
                          record.data_date
                        ).toLocaleDateString()}</td>
                        <td>${record.time_period}</td>
                        <td>${record.content}</td>
                    `;

        tableBody.appendChild(row);
      });
    })
    .catch((error) => {
      console.error('Error fetching records:', error);
    });
});

// 頁面載入時自動觸發篩選按鈕，顯示所有記錄
document.getElementById('filterButton').click();
