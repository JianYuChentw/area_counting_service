const { body, param, query, validationResult } = require('express-validator');

/**
 * 日期驗證規則：檢查請求中是否存在 `date` 參數，且格式符合 `YYYY/MM/DD`。
 */
const validateDate = [
  query('date')
    .exists().withMessage('日期參數是必要的')
    .matches(/^\d{4}\/\d{2}\/\d{2}$/).withMessage('日期格式無效，應為 YYYY/MM/DD'),
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
 * 區域時段計數器驗證規則：檢查請求體中的 `region_id`、`counter_time`、`date`、`max_counter_value` 是否有效。
 */
const validateRegionCounter = [
  body('region_id')
    .exists().withMessage('區域 ID 是必要的')
    .isInt().withMessage('區域 ID 必須是整數'),
  body('counter_time')
    .exists().withMessage('計數時間區段是必要的')
    .matches(/^\d{2}:\d{2}$/).withMessage('計數時間格式無效，應為 HH:mm'),
  body('date')
    .exists().withMessage('日期是必要的')
    .matches(/^\d{4}\/\d{2}\/\d{2}$/).withMessage('日期格式無效，應為 YYYY/MM/DD'),
  body('max_counter_value')
    .exists().withMessage('最大計數值是必要的')
    .isInt({ min: 0 }).withMessage('最大計數值必須是一個大於或等於 0 的整數'),
];

/**
 * 驗證請求中的參數，並處理驗證錯誤。如果有錯誤，返回 400 錯誤狀態碼和錯誤訊息。
 * @function validate
 * @param {Object} req - Express 請求對象，包含要驗證的資料。
 * @param {Object} res - Express 回應對象，用來返回驗證結果。
 * @param {Function} next - Express 的 next 函數，讓下一個中介函數繼續執行。
 * @returns {void|Object} - 如果驗證失敗，返回 400 錯誤狀態碼和錯誤訊息，否則繼續執行。
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
  validateRegionCounter,
  validate,
};
