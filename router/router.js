const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const roleGuard = require('../middleware/role-guard')
const { getRegionCounters, addRegionArea, deleteRegionArea, updateRegionArea, getAllRegionAreas,getSingleDayRegionName } = require('../controllers/arerCtrl');
const { addAreaTimePeriodCounter, deleteAreaTimePeriodCounter, updateAreaTimePeriodCounter } = require('../controllers/areaTimePeriodCtrl');
const { getCacheSwitchStatus, updateCacheSwitchStatus } = require('../controllers/switchCtrl');
const { validateDate, validateAreaAndMaxCount, validateId, validateRegionCounter, validateUpdateCounter, validate } = require('../utils/validator'); // 確保所有驗證器正確引入

// 區域API


// 取得區域計數資料
router.get('/single_day_area_counter', validateDate, validate, getRegionCounters);

router.get('/single_day_area_name', validateDate, validate, getSingleDayRegionName);

// 取得所有區域資料
router.get('/all_regions',roleGuard('admin'), getAllRegionAreas);  

// 新增區域
router.post('/add_region', validateAreaAndMaxCount, validate, addRegionArea);

// 刪除區域
router.delete('/delete_region/:id', validateId, validate, deleteRegionArea);

// 更新區域名稱及最大計數值
router.put('/update_region/:id', validateId, validateAreaAndMaxCount, validate, updateRegionArea);

// 時段API

// 新增區域時段計數器
router.post('/add_region_counter', validateRegionCounter, validate, addAreaTimePeriodCounter);

// 刪除區域時段計數器
router.delete('/delete_region_counter/:id', validateId, validate, deleteAreaTimePeriodCounter);

// 更新區域時段計數器
router.put('/update_region_counter/:id', validateUpdateCounter, validate, updateAreaTimePeriodCounter);

// 開關API

// 取得目前的快取開關狀態
router.get('/cache_switch', getCacheSwitchStatus);

// 更新快取開關狀態
router.post('/cache_switch', updateCacheSwitchStatus);

// 登入路由
router.post('/login', authController.login);

// 註冊路由
router.post('/register', authController.register);

// 登出路由
router.post('/logout', authController.logout);


// 檢查登入狀態 API
router.get('/checkLogin', authController.checkLogin);

module.exports = router;
