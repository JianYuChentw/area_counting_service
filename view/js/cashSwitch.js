// const cashBaseUrl = 'http://localhost:3100/api2'; // 伺服器基礎 URL
const cashBaseUrl = 'http://3.27.140.23/api2'; // 修改為雲端伺服器基礎 URL



// 取得目前快取開關狀態
async function fetchCacheStatus() {
  try {
    const response = await fetch(`${cashBaseUrl}/cache_switch`);
    
    const result = await response.json();
    if (response.ok) {
      const cacheSwitch = document.getElementById('cacheSwitch');
      const statusText = document.getElementById('statusText');
      
      // 根據取得的狀態來設置開關和狀態文字
      cacheSwitch.checked = result.cacheEnabled;
      statusText.textContent = result.cacheEnabled ? '啟用' : '停用';
    } else {
      alert('無法取得快取狀態');
    }
  } catch (error) {
    console.error('查詢失敗:', error);
    alert('查詢失敗，請稍後再試');
  }
}

// 更新快取開關狀態並改變文字
document.getElementById('cacheSwitch').addEventListener('change', async (e) => {
  const enabled = e.target.checked;
  const statusText = document.getElementById('statusText');
  
  try {
    const response = await fetch(`${cashBaseUrl}/cache_switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    const result = await response.json();
    
    if (response.ok) {
      // 更新前台狀態文字
      statusText.textContent = enabled ? '啟用' : '停用';
      
    } else {
      alert(result.message || '更新失敗');
    }
  } catch (error) {
    console.error('更新失敗:', error);
    alert('更新失敗，請稍後再試');
  }
});

// 初始化時獲取快取狀態
fetchCacheStatus();
