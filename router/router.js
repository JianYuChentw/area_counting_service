const express = require('express');
const router = express.Router();
const { getRegionCounters, addRegionArea, deleteRegionArea, updateRegionArea, getAllRegionAreas } = require('../controllers/arerCtrl');
const { addAreaTimePeriodCounter, deleteAreaTimePeriodCounter, updateAreaTimePeriodCounter } = require('../controllers/areaTimePeriodCtrl');
const { validateDate, validateAreaAndMaxCount, validateId, validateRegionCounter, validate } = require('../utils/validator'); // 確保所有驗證器正確引入

// 區域API

// 取得區域計數資料
router.get('/single_day_area_counter', validateDate, validate, getRegionCounters);

// 取得所有區域資料
router.get('/all_regions', getAllRegionAreas);  

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
router.put('/update_region_counter/:id', validateId, validateRegionCounter, validate, updateAreaTimePeriodCounter);

module.exports = router;
