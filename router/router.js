const express = require('express');
const router = express.Router();
const { getRegionCounters } = require('../controllers/arerCtrl');
const { validateDate, validate } = require('../utils/validator');

/**
 * 取得單日區域計數器資料的路由。
 * 使用 `validateDate` 和 `validate` 作為中介層來驗證請求中的 `date` 參數。
 * @name get/single_day_area_counter
 * @function
 * @memberof module:routers/areaRouter
 * @inner
 * @param {string} path - Express 路由的路徑。
 * @param {Array} middleware - 包含 `validateDate` 和 `validate` 的驗證中介層。
 * @param {Function} middleware - 處理區域計數器資料的控制層函數。
 * @returns {void}
 */
router.get('/single_day_area_counter', validateDate, validate, getRegionCounters);

module.exports = router;
