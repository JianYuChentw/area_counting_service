    document.getElementById('timePeriodTripsManagementBtn').addEventListener('click', function() {
      window.location.href = './areaTimePeriod.html';  // 目標頁面
    });

    document.getElementById('recordsBtn').addEventListener('click', function() {
      window.location.href = './recordsPage.html';  // 目標頁面
    });

    // 顯示所有區域資料
    async function fetchAllRegions() {
      try {
        const response = await fetch(`${baseUrl}/all_regions`);
        const regions = await response.json();
        if (response.ok) {
          const table = document.getElementById('allRegionsTable');
          table.style.display = 'table';
          const tbody = table.querySelector('tbody');
          tbody.innerHTML = '';
          regions.forEach(region => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${region.area}</td>
              <td>${region.max_count}</td>
              <td>
                <button class="btn btn-success"  onclick="editRegion(${region.id}, '${region.area}', ${region.max_count})">編輯</button>
                <button class="btn btn-danger" onclick="deleteRegion(${region.id}, '${region.area}')">刪除</button>
              </td>
            `;
            tbody.appendChild(row);
          });
        } else {
          alert('無法取得區域資料');
        }
      } catch (error) {
        console.error('查詢失敗:', error);
        alert('查詢失敗，請稍後再試');
      }
    }

    // 呼叫 API 顯示所有區域資料
    fetchAllRegions();

    // 檢查輸入是否包含不允許的字符
    function containsInvalidCharacters(str) {
      const invalidCharacters = /[\\'"`;]/;
      return invalidCharacters.test(str);
    }

    // 新增區域
    document.getElementById('addRegionForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const area = document.getElementById('newArea').value;
      let max_count = document.getElementById('maxCount').value;

      // 檢查區域名稱是否包含不允許的字符
      if (containsInvalidCharacters(area)) {
          alert('區域名稱不能包含特殊字符，如 \\ , \' , " , ` , ;');
          return;
      }

      // 如果 max_count 沒有填寫，設為 undefined 讓後端處理
      if (max_count === "") {
          max_count = undefined;
      }

      // 取得台北時間的日期 (格式: YYYY-MM-DD)
      const taipeiDate = new Date().toLocaleString("en-US", { timeZone: "Asia/Taipei" });
      const formattedDate = new Date(taipeiDate).toISOString().split('T')[0]; // YYYY-MM-DD 格式

      try {
          const response = await fetch(`${baseUrl}/add_region`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ area, max_count, date: formattedDate }), // 傳遞台北日期
          });
          const result = await response.json();

          if (response.ok) {
              alert(result.message || '區域新增成功');
              fetchAllRegions(); // 重新加載區域列表
          } else if (response.status === 503) {
              alert('服務中，無法進行新增操作。');
          } else {
              alert(result.message || '新增失敗');
          }
      } catch (error) {
          console.error('新增失敗:', error);
          alert('新增失敗，請稍後再試');
      }
    });

    // 更新區域
    async function updateRegion(id, area, max_count) {
      try {
        const response = await fetch(`${baseUrl}/update_region/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ area, max_count }),
        });
        const result = await response.json();

        if (response.ok) {
          alert(`區域「${area}」更新成功`);
          fetchAllRegions(); // 重新加載區域列表
        } else if (response.status === 503) {
          alert('服務中，無法進行更新操作。');
        } else {
          alert(result.message || '更新失敗');
        }
      } catch (error) {
        console.error('更新失敗:', error);
        alert('更新失敗，請稍後再試');
      }
    }

    // 刪除區域
    async function deleteRegion(id, area) {
      if (confirm(`確定要刪除區域「${area}」嗎？`)) {
        console.log(id, area);
        
        try {
          const response = await fetch(`${baseUrl}/delete_region/${id}`, {
            method: 'DELETE',
          });
          const result = await response.json();

          if (response.ok) {
            alert(`區域「${area}」已刪除`);
            fetchAllRegions(); // 重新加載區域列表
          } else if (response.status === 503) {
            alert('服務中，無法進行刪除操作。');
          } else {
            alert(result.message || '刪除失敗');
          }
        } catch (error) {
          console.error('刪除失敗:', error);
          alert('刪除失敗，請稍後再試');
        }
      }
    }

    // 編輯區域
    function editRegion(id, area, max_count) {
      const newArea = prompt('請輸入新的區域名稱:', area);
      const newMaxCount = prompt('請輸入新的最大趟數:', max_count);
      
      // 檢查區域名稱是否包含不允許的字符
      if (newArea !== null && containsInvalidCharacters(newArea)) {
        alert('區域名稱不能包含特殊字符，如 \\ , \' , " , ` , ;');
        return;
      }

      if (newArea !== null && newMaxCount !== null) {
        updateRegion(id, newArea, newMaxCount);
      }
    }

