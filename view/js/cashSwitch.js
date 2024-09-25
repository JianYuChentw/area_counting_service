const cashBaseUrl = 'http://localhost:3100'; // 伺服器基礎 URL

// 呼叫 API 取得目前快取開關狀態
fetchCacheStatus();

// 取得目前快取開關狀態
async function fetchCacheStatus() {
  try {
    const response = await fetch(`${cashBaseUrl}/cache_switch`);;
    
    const result = await response.json();
    if (response.ok) {
      const cacheSwitch = document.getElementById('cacheSwitch');
      cacheSwitch.checked = result.cacheEnabled;
    } else {
      alert('無法取得快取狀態');
    }
  } catch (error) {
    console.error('查詢失敗:', error);
    alert('查詢失敗，請稍後再試');
  }
}

// 更新快取開關狀態
document.getElementById('cacheSwitch').addEventListener('change', async (e) => {
  const enabled = e.target.checked;
  try {
    const response = await fetch(`${cashBaseUrl}/cache_switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    const result = await response.json();
    
    if (response.ok) {
      alert(result.message);
    } else {
      alert(result.message || '更新失敗');
    }
  } catch (error) {
    console.error('更新失敗:', error);
    alert('更新失敗，請稍後再試');
  }
});