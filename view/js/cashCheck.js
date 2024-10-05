// 定期檢查快取開關狀態
async function checkCacheStatus() {
    try {
      const response = await fetch(`${baseUrl}/cache_switch`);
      const result = await response.json();
      const maintenanceOverlay = document.getElementById('maintenanceOverlay');
      
      if (response.ok && result.cacheEnabled) {
        maintenanceOverlay.style.display = 'none';  // 隱藏維護提示
  
        
      } else {
        maintenanceOverlay.style.display = 'flex';  // 顯示維護提示
      }
    } catch (error) {
      console.error('檢查快取狀態失敗:', error);
      maintenanceOverlay.style.display = 'flex';  // 發生錯誤時顯示維護提示
    }
  }

// 開始定期檢查快取狀態
checkInterval = setInterval(checkCacheStatus, 3000);  // 每3秒檢查一次