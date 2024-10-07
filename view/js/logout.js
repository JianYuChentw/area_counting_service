document.getElementById('logoutBtn').addEventListener('click', function () {
  // 發送登出請求

  fetch(`${baseUrl}/logout`, {
    method: 'POST',
    credentials: 'include', // 確保 Session Cookie 被傳遞
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.message === '登出成功') {
        // 登出成功，跳轉到登出後的頁面
        window.location.href = './loginPage.html'; // 登出後跳轉的目標頁面
      } else {
        console.error('登出失敗:', data);
      }
    })
    .catch((error) => {
      console.error('登出過程中發生錯誤:', error);
    });
});