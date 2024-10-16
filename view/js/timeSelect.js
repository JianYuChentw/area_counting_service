// 動態生成小時與分鐘選項
function populateTimeSelectors() {
  const hourSelect = document.getElementById('counterTimeHour');
  const minuteSelect = document.getElementById('counterTimeMinute');
  
  // 小時選項（07 到 19）
  for (let i = 7; i < 20; i++) {
    const option = document.createElement('option');
    option.value = i < 10 ? '0' + i : i;
    option.text = i < 10 ? '0' + i : i;
    hourSelect.appendChild(option);
  }


  const minutes = ['00', '15', '30', '45'];
  minutes.forEach(min => {
    const option = document.createElement('option');
    option.value = min;
    option.text = min;
    minuteSelect.appendChild(option);
  });
}

// 組合時和分鐘
function getSelectedTime() {
  const hour = document.getElementById('counterTimeHour').value;
  const minute = document.getElementById('counterTimeMinute').value;
  return `${hour}:${minute}:00`; // 返回完整的時間格式
}

// 初始化時間選擇器
populateTimeSelectors();

document.getElementById('addCounterBtn').addEventListener('click', () => {
  const selectedTime = getSelectedTime();
  const regionId = document.getElementById('regionSelect').value;
  const maxCounterValue = document.getElementById('maxCounterValue').value;

  console.log('選擇的時間:', selectedTime);
  console.log('選擇的區域:', regionId);
  console.log('最大趟數:', maxCounterValue);

  // 在這裡進行數據提交的處理邏輯
  // 例如，你可以將選擇的時間和其他數據發送到後端 API
});
