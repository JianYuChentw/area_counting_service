const bcrypt = require('bcrypt');
const userModel = require('../model/user');

// 處理登入邏輯
async function login(req, res) {
    const { username, password } = req.body;
  
    if (!username || !password) {
      return res.status(400).json({ loggedIn:false, message: '請提供帳號與密碼' });
    }
  
    try {
      const user = await userModel.findUserByUsername(username);
      if (!user) {
        return res.status(401).json({ loggedIn:false, message: '帳號或密碼錯誤' });
      }
  
      const isPasswordValid = await bcrypt.compare(password, user.password);
  
      if (!isPasswordValid) {
        return res.status(401).json({  message: '帳號或密碼錯誤' });
      }
  
      // 根據角色設置 session
      req.session[user.role] = {
        id: user.id,
        username: user.username,
        role: "admin"
      };
      res.json({ loggedIn:true, status:200, message: '登入成功' });
    } catch (error) {
      console.error('登入錯誤:', error);
      res.status(500).json({ loggedIn:false, message: '伺服器發生錯誤，請稍後再試' });
    }
  }
  

// 處理註冊邏輯
async function register(req, res) {
  const { username, password, role } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: '請提供帳號與密碼' });
  }

  try {
    const existingUser = await userModel.findUserByUsername(username);

    if (existingUser) {
      return res.status(409).json({ message: '帳號已存在' });
    }

    await userModel.createUser(username, password, role);
    res.json({ message: '註冊成功' });

  } catch (error) {
    console.error('註冊錯誤:', error);
    res.status(500).json({ message: '伺服器發生錯誤，請稍後再試' });
  }
}

// 處理登出邏輯
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: '登出時發生錯誤' });
    }

    res.json({ message: '登出成功' });
  });
}


// 檢查用戶登入狀態的 API
function checkLogin(req, res) {
    
    if (req.session.user || req.session.admin) {
      // 根據角色判斷
      if (req.session.admin) {
        return res.json({ loggedIn: true, role: 'admin' });
      } else {
        return res.json({ loggedIn: true, role: 'user' });
      }
    } else {
      return res.json({ loggedIn: false });
    }
  }

module.exports = {
  login,
  register,
  logout,
  checkLogin
};
