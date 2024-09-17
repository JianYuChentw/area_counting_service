const { body, param, query, validationResult } = require('express-validator');

/**
 * 日期驗證規則：檢查請求中是否存在 `date` 參數，且格式符合 `YYYY-MM-DD`。
 */
const validateDate = [
  query('date')
    .exists().withMessage('日期參數是必要的')
    .isISO8601().withMessage('日期格式無效，應為 YYYY-MM-DD'),
];

/**
 * ID 驗證規則：檢查請求中的 `id` 是否為整數。
 */
const validateId = [
  param('id')
    .exists().withMessage('ID 參數是必要的')
    .isInt().withMessage('ID 必須是一個有效的整數'),
];

/**
 * 區域名稱驗證規則：檢查請求體中的 `area` 是否有效。
 */
const validateArea = [
  body('area')
    .exists({ checkNull: true, checkFalsy: true }).withMessage('區域名稱是必要的')
    .isString().withMessage('區域名稱必須是字串')
    .isLength({ min: 1 }).withMessage('區域名稱不能為空'),
];

/**
 * 驗證請求中的參數，並處理驗證錯誤。如果有錯誤，返回 400 狀態碼和錯誤訊息。
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // 將錯誤訊息格式化
    const formattedErrors = errors.array().map(err => ({
      type: err.type,
      msg: err.msg,
      path: err.param,
      location: err.location,
    }));
    return res.status(400).json({ errors: formattedErrors });
  }
  next();
}

module.exports = {
  validateDate,
  validateId,
  validateArea,
  validate,
};
