const express = require('express');
const router = express.Router();
const { getRegionCounters, addRegionController, deleteRegionController, updateRegionController } = require('../controllers/arerCtrl'); 
const { validateDate, validateArea, validateId, validate } = require('../utils/validator'); // 確保所有驗證器正確引入

// 取得區域計數資料的路由
router.get('/single_day_area_counter', validateDate, validate, getRegionCounters);

// 新增區域的路由
router.post('/add_region', validateArea, validate, addRegionController);

// 刪除區域的路由
router.delete('/delete_region/:id', validateId, validate, deleteRegionController);

// 更新區域的路由
router.put('/update_region/:id', validateId, validateArea, validate, updateRegionController);


module.exports = router;
