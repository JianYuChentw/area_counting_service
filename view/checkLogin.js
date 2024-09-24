window.addEventListener('load', () => {
    fetch('http://localhost:3000/checkLogin', {
      method: 'GET',
      credentials: 'include'  // 確保 cookie 被傳遞
    })
    .then(response => response.json())
    .then(data => {
      if (!data.loggedIn) {
          window.location.href = "http://127.0.0.1:5500/view/loginPage.html";
      }
    })
    .catch(error => {
      console.error('檢查登入狀態錯誤:', error);
    });
  });