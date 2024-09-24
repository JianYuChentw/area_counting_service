
/**
 * 權限驗證
 * @param {string} role 角色權限
 * @returns 
 */
function roleGuard(role) {
  return (req, res, next) => {
    const uid = req.session[role];
    if (uid === undefined) {
      return res.json("非登入狀態，請重新登入。");
    }
    req[role] = uid;
    next();
  };
}

module.exports = roleGuard