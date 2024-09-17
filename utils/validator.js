const { check, validationResult } = require('express-validator');

/**
 * 日期驗證規則：檢查請求中是否存在 `date` 參數，且格式符合 `YYYY-MM-DD`。
 * @constant
 * @type {Array}
 */
const validateDate = [
  check('date')
    .exists().withMessage('日期參數是必要的')
    .isISO8601().withMessage('日期格式無效，應為 YYYY-MM-DD'),
];

/**
 * 驗證請求中的參數，並處理驗證錯誤。如果有錯誤，返回 400 狀態碼和錯誤訊息。
 * @function validate
 * @param {Object} req - Express 請求對象，包含要驗證的資料。
 * @param {Object} res - Express 回應對象，用來返回驗證結果。
 * @param {Function} next - 下一個中介函數，當驗證通過時繼續執行下一個邏輯。
 * @returns {void|Object} - 如果驗證失敗，返回 400 錯誤狀態碼和錯誤訊息，否則繼續執行。
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

module.exports = {
  validateDate,
  validate,
};
