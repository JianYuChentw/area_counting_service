// 當頁面加載時，檢查用戶是否已經登入
const adminPage = "./areaTimePeriod.html";

window.addEventListener('load', () => {
//   fetch('http://localhost:3100/checkLogin', {
  fetch('http://3.27.140.23:8090/api2/checkLogin', {
    method: 'GET',
    credentials: 'include'  // 確保 Session Cookie 被傳遞
  })
  .then(response => {    
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('檢查登入狀態失敗');
    }
  })
  .then(data => {
    console.log(data.loggedIn);
    
    if (data.loggedIn) {
      // 用戶已登入，跳轉到目標頁面
      window.location.href = adminPage;
    }
  })
  .catch(error => {
    console.error('檢查登入狀態錯誤:', error);
  });
});

// 綁定表單的 submit 事件
document.getElementById('loginForm').addEventListener('submit', (event) => {
  event.preventDefault();  // 阻止表單提交的默認行為

  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorMessage = document.getElementById('errorMessage');

  // 清除錯誤訊息
  errorMessage.textContent = '';

  // 基本驗證
  if (!username || !password) {
    errorMessage.textContent = '請輸入使用者名稱和密碼';
    return;
  }

  const data = {
    username: username,
    password: password
  };

  // 發送登入請求
//   fetch('http://localhost:3100/login', {
  fetch('http://3.27.140.23/api2/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
    credentials: 'include'  // 確保 Session Cookie 被傳遞
  })
  .then(response => {
    if (response.ok) {
      return response.json();
    } else {
      throw new Error('登入失敗');
    }
  })
  .then(data => {
    console.log(data.loggedIn);
    if (data.loggedIn) {
      // 登入成功，跳轉到目標頁面
      window.location.href = adminPage;
    } else {
      errorMessage.textContent = data.message || '登入失敗，請稍後再試。';
    }
  })
  .catch(error => {
    console.error('登入過程中發生錯誤:', error);
    errorMessage.textContent = '伺服器錯誤，請稍後再試';
  });
});
