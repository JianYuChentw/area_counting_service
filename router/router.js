const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const roleGuard = require('../middleware/role-guard')
const { getRegionCounters, addRegionArea, deleteRegionArea, updateRegionArea, getAllRegionAreas,getSingleDayRegionName } = require('../controllers/arerCtrl');
const { addAreaTimePeriodCounter, deleteAreaTimePeriodCounter, updateAreaTimePeriodCounter } = require('../controllers/areaTimePeriodCtrl');
const { getCacheSwitchStatus, updateCacheSwitchStatus } = require('../controllers/switchCtrl');
const{createRecord, getRecords, removeRecord} = require('../controllers/operateRecordsCtrl')
const {   
    validateDate,
    validateId,
    validateAreaAndMaxCount,
    validateRegionCounter,
    validateUpdateCounter,
    validateCreateRecord,
    validateGetRecords,
    validate, } = require('../utils/validator'); // 確保所有驗證器正確引入

// 區域API
// 取得區域計數資料
router.get('/single_day_area_counter',roleGuard('admin'), validateDate, validate, getRegionCounters);

router.get('/single_day_area_name',roleGuard('admin'), validateDate, validate, getSingleDayRegionName);

// 取得所有區域資料
router.get('/all_regions',roleGuard('admin'), getAllRegionAreas);  

// 新增區域
router.post('/add_region', roleGuard('admin'), validateAreaAndMaxCount, validate, addRegionArea);

// 刪除區域
router.delete('/delete_region/:id', roleGuard('admin'),  validateId, validate, deleteRegionArea);

// 更新區域名稱及最大計數值
router.put('/update_region/:id' ,roleGuard('admin') , validateId, validateAreaAndMaxCount, validate, updateRegionArea);

// 時段API

// 新增區域時段計數器
router.post('/add_region_counter',roleGuard('admin'), validateRegionCounter, validate, addAreaTimePeriodCounter);

// 刪除區域時段計數器
router.delete('/delete_region_counter/:id',roleGuard('admin'), validateId, validate, deleteAreaTimePeriodCounter);

// 更新區域時段計數器
router.put('/update_region_counter/:id',roleGuard('admin'), validateUpdateCounter, validate, updateAreaTimePeriodCounter);

// 開關API

// 取得目前的快取開關狀態
router.get('/cache_switch', getCacheSwitchStatus);

// 更新快取開關狀態
router.post('/cache_switch',roleGuard('admin'), updateCacheSwitchStatus);

// 變動紀錄API
// 新增操作記錄，包含資料驗證
router.post('/records',roleGuard('admin'), validateCreateRecord, validate, createRecord);

// 獲取操作記錄，包含日期參數的驗證
router.get('/records',roleGuard('admin'), validateGetRecords, validate, getRecords);

// 刪除操作記錄，包含ID的驗證
router.delete('/records/:id',roleGuard('admin'), validateId, validate, removeRecord);


// 登入
router.post('/login', authController.login);

// 註冊
router.post('/register', authController.register);

// 登出
router.post('/logout', authController.logout);


// 檢查登入狀態 API
router.get('/checkLogin', authController.checkLogin);

module.exports = router;
