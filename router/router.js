const express = require('express');
const router = express.Router();
const { getRegionCounters, addRegionArea, deleteRegionArea, updateRegionAreaName } = require('../controllers/arerCtrl');
const { addTimePeriodCounter, deleteTimePeriodCounter, updateTimePeriodCounter } = require('../controllers/timePeriodCtrl');
const { validateDate, validateArea, validateId, validateRegionCounter, validate } = require('../utils/validator');

// 區域API

// 取得區域計數資料
router.get('/single_day_area_counter', validateDate, validate, getRegionCounters);

// 新增區域
router.post('/add_region', validateArea, validate, addRegionArea);

// 刪除區域
router.delete('/delete_region/:id', validateId, validate, deleteRegionArea);

// 更新區域名稱
router.put('/update_region/:id', validateId, validateArea, validate, updateRegionAreaName);

// 時段API

// 新增區域時段計數器
router.post('/add_region_counter', validateRegionCounter, validate, addTimePeriodCounter);

// 刪除區域時段計數器
router.delete('/delete_region_counter/:id', validateId, validate, deleteTimePeriodCounter);

// 更新區域時段計數器
router.put('/update_region_counter/:id', validateId, validateRegionCounter, validate, updateTimePeriodCounter);



module.exports = router;
