/**
 * 權限驗證
 * @param {string} role 角色權限
 * @returns {Function} 中間件函數
 */
function roleGuard(role) {
  return (req, res, next) => {
    console.log(req.session[role]);
    
    const uid = req.session[role];

    // 如果 session 中沒有對應的角色 ID，則返回 401 錯誤（未授權）
    if (!uid) {
      return res.status(401).json({ message: '未登入，請重新登入。' });
    }

    // 如果 session 中有對應的角色 ID，則將其存入 req
    req[role] = uid;
    next();
  };
}

module.exports = roleGuard;
