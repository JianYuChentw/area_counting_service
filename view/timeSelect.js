      // 動態生成以30分鐘為間隔的時間選擇器
      const counterTime = document.getElementById('counterTime');
      
      // 設定開始與結束時間
      const startTime = 7 * 60; // 8:00，換算成分鐘
      const endTime = 20 * 60; // 18:00，換算成分鐘
  
      for (let time = startTime; time <= endTime; time += 30) {
        const hours = Math.floor(time / 60).toString().padStart(2, '0');
        const minutes = (time % 60).toString().padStart(2, '0');
        const option = document.createElement('option');
        option.value = `${hours}:${minutes}`;
        option.text = `${hours}:${minutes}`;
        counterTime.appendChild(option);
      }