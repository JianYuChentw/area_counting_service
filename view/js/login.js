// 當頁面加載時，檢查用戶是否已經登入
const adminPage = "./areaTimePeriod.html";
// const baseUrl = 'http://localhost:3100/api2'; // 伺服器基礎 URL

const baseUrl = 'http://3.27.140.23/api2'; // 修改為雲端伺服器基礎 URL

window.addEventListener('load', () => {
  fetch(`${baseUrl}/checkLogin`, {
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
  fetch(`${baseUrl}/login`, {
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
      if (response.status === 401) {
        errorMessage.textContent = '帳號或密碼錯誤';
        return;  // 停止後續的處理
      }
      throw new Error('登入失敗');
    }
  })
  .then(data => {
    if (data && data.loggedIn) {
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

// 顯示/隱藏密碼功能
document.getElementById('togglePassword').addEventListener('click', function () {
  const passwordField = document.getElementById('password');
  const toggleButton = this;

  // 切換密碼顯示與隱藏
  if (passwordField.type === 'password') {
    passwordField.type = 'text';
    // 替換成 "隱藏" 圖標
    toggleButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-emoji-grimace" viewBox="0 0 16 16">
        <path d="M7 6.25c0 .69-.448 1.25-1 1.25s-1-.56-1-1.25S5.448 5 6 5s1 .56 1 1.25m3 1.25c.552 0 1-.56 1-1.25S10.552 5 10 5s-1 .56-1 1.25.448 1.25 1 1.25m2.98 3.25A1.5 1.5 0 0 1 11.5 12h-7a1.5 1.5 0 0 1-1.48-1.747v-.003A1.5 1.5 0 0 1 4.5 9h7a1.5 1.5 0 0 1 1.48 1.747zm-8.48.75h.25v-.75H3.531a1 1 0 0 0 .969.75m7 0a1 1 0 0 0 .969-.75H11.25v.75zm.969-1.25a1 1 0 0 0-.969-.75h-.25v.75zM4.5 9.5a1 1 0 0 0-.969.75H4.75V9.5zm1.75 2v-.75h-1v.75zm.5 0h1v-.75h-1zm1.5 0h1v-.75h-1zm1.5 0h1v-.75h-1zm1-2h-1v.75h1zm-1.5 0h-1v.75h1zm-1.5 0h-1v.75h1zm-1.5 0h-1v.75h1z"/>
        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m0-1A7 7 0 1 1 8 1a7 7 0 0 1 0 14"/></svg>`;
  } else {
    passwordField.type = 'password';
    // 替換成 "顯示" 圖標
      toggleButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-emoji-dizzy" viewBox="0 0 16 16">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14m0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16"/>
          <path d="M9.146 5.146a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 0 1 .708.708l-.647.646.647.646a.5.5 0 0 1-.708.708l-.646-.647-.646.647a.5.5 0 1 1-.708-.708l.647-.646-.647-.646a.5.5 0 0 1 0-.708m-5 0a.5.5 0 0 1 .708 0l.646.647.646-.647a.5.5 0 1 1 .708.708l-.647.646.647.646a.5.5 0 1 1-.708.708L5.5 7.207l-.646.647a.5.5 0 1 1-.708-.708l.647-.646-.647-.646a.5.5 0 0 1 0-.708M10 11a2 2 0 1 1-4 0 2 2 0 0 1 4 0"/></svg>`;
  }
});
