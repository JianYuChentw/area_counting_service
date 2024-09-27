window.addEventListener('load', () => {
    // fetch('http://localhost:3100/api2/checkLogin', {
    fetch('http://3.27.140.23/api2/checkLogin', {
      method: 'GET',
      credentials: 'include'  // 確保 cookie 被傳遞
    })
    .then(response => response.json())
    .then(data => {
      console.log(data);
      
      if (!data.loggedIn) {
          window.location.href = "./loginPage.html";
      }
    })
    .catch(error => {
      console.error('檢查登入狀態錯誤:', error);
    });
  });
