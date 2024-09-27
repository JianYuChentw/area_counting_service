const { addRecord, getRecordsByConditions, deleteRecord } = require('../model/operateRecords');

/**
 * 新增操作記錄的控制器
 * 
 * @param {Object} req - 請求物件，應包含記錄的日期、時間片和內容
 * @param {Object} res - 回應物件，用來回應成功或失敗的結果
 */
async function createRecord(req, res) {
  const { record_date, time_period, content } = req.body;

  if (!record_date || !time_period || !content) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const recordId = await addRecord(record_date, time_period, content);
    return res.status(201).json({ success: true, recordId });
  } catch (error) {
    console.error('Error in createRecord:', error);
    return res.status(500).json({ error: 'Failed to create record' });
  }
}

/**
 * 根據條件獲取操作記錄的控制器
 * 
 * @param {Object} req - 請求物件，應包含開始日期、結束日期和時間片的查詢參數
 * @param {Object} res - 回應物件，用來回應篩選的結果
 */
async function getRecords(req, res) {
  const { startDate, endDate, timePeriod } = req.query;

  try {
    const records = await getRecordsByConditions(startDate, endDate, timePeriod);
    return res.status(200).json(records);
  } catch (error) {
    console.error('Error in getRecords:', error);
    return res.status(500).json({ error: 'Failed to fetch records' });
  }
}

/**
 * 刪除操作記錄的控制器
 * 
 * @param {Object} req - 請求物件，應包含要刪除的記錄 ID
 * @param {Object} res - 回應物件，用來回應成功或失敗的結果
 */
async function removeRecord(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ error: 'Missing record ID' });
  }

  try {
    const success = await deleteRecord(id);
    if (success) {
      return res.status(200).json({ success: true });
    } else {
      return res.status(404).json({ error: 'Record not found' });
    }
  } catch (error) {
    console.error('Error in removeRecord:', error);
    return res.status(500).json({ error: 'Failed to delete record' });
  }
}

module.exports = { createRecord, getRecords, removeRecord };
