function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}/${month}/${day} - ${hours}:${minutes}:${seconds}`;
  }


  function getTaiwanDate() {
    const taiwanOffset = 8 * 60; // 台灣時區 UTC+8
    const now = new Date();
    const localTime = now.getTime();
    const localOffset = now.getTimezoneOffset() * 60000; // 當地時區偏移（以毫秒計）
    const taiwanTime = new Date(localTime + localOffset + taiwanOffset * 60000);
    
    // 將日期格式化為 YYYY-MM-DD
    const year = taiwanTime.getFullYear();
    const month = String(taiwanTime.getMonth() + 1).padStart(2, '0'); // 月份是從 0 開始的，所以要 +1
    const day = String(taiwanTime.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }

  /**
 * 基於傳入的起始日期獲取未來10天的日期
 * @param {string} startDate - 起始日期，格式為 YYYY-MM-DD
 * @returns {Array<string>} - 返回日期陣列，格式為 YYYY-MM-DD
 */
function getDatesForNextTenDaysFrom(startDate) {
  const dates = [];
  const today = new Date(startDate); // 基於傳入的起始日期
  
  // 包含當日和未來10天
  for (let i = 0; i <= 10; i++) {
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + i);
    const formattedDate = futureDate.toISOString().split('T')[0]; // 格式化為 YYYY-MM-DD
    dates.push(formattedDate);
  }

  return dates;
}
  
  module.exports = { formatTimestamp, getTaiwanDate, getDatesForNextTenDaysFrom };
  