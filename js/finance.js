// ==================== 财务统计页面逻辑 ====================

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadFinanceData();
});

// 加载财务数据
function loadFinanceData() {
    const members = DataManager.getMembers();
    
    // 计算总收入
    let totalIncome = 0;
    let monthIncome = 0;
    let activeMembers = 0;
    let totalCourses = 0;
    
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const incomeRecords = [];
    
    members.forEach(member => {
        // 累计总收入
        totalIncome += member.totalAmount || 0;
        
        // 累计剩余课时
        totalCourses += member.remainingCourses || 0;
        
        // 判断是否活跃会员（有剩余课时）
        if (member.remainingCourses > 0) {
            activeMembers++;
        }
        
        // 计算本月收入（根据入会日期）
        if (member.joinDate) {
            const joinDate = new Date(member.joinDate);
            if (joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear) {
                monthIncome += member.totalAmount || 0;
                
                incomeRecords.push({
                    name: member.name,
                    amount: member.totalAmount || 0,
                    date: member.joinDate,
                    type: '入会'
                });
            }
        }
    });
    
    // 更新统计卡片
    document.getElementById('totalIncome').textContent = `¥${totalIncome.toFixed(2)}`;
    document.getElementById('monthIncome').textContent = `¥${monthIncome.toFixed(2)}`;
    document.getElementById('activeMembers').textContent = `${activeMembers}人`;
    document.getElementById('totalCourses').textContent = `${totalCourses}节`;
    
    // 渲染收入明细列表
    renderIncomeList(incomeRecords);
}

// 渲染收入明细列表
function renderIncomeList(records) {
    const container = document.getElementById('incomeList');
    
    if (records.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 40px 20px;">
                <div class="empty-icon" style="font-size: 48px;">💰</div>
                <div class="empty-text">本月暂无收入记录</div>
            </div>
        `;
        return;
    }
    
    // 按日期倒序排列
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = records.map(record => {
        const date = new Date(record.date);
        const dateStr = date.toLocaleDateString('zh-CN', { 
            year: 'numeric', 
            month: '2-digit', 
            day: '2-digit' 
        });
        
        return `
            <div class="income-item">
                <div class="income-item-info">
                    <div class="income-item-name">${record.name} - ${record.type}</div>
                    <div class="income-item-date">${dateStr}</div>
                </div>
                <div class="income-item-amount">+¥${record.amount.toFixed(2)}</div>
            </div>
        `;
    }).join('');
}
