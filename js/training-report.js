// ==================== 训练记录报告生成 ====================

let currentMemberId = null;
let member = null;
let trainingRecords = [];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initReport();
});

// 初始化报告
function initReport() {
    // 从URL参数获取会员ID
    const urlParams = new URLSearchParams(window.location.search);
    currentMemberId = urlParams.get('memberId');
    
    if (!currentMemberId) {
        alert('未指定会员ID');
        window.close();
        return;
    }

    currentMemberId = parseInt(currentMemberId);
    member = DataManager.getMemberById(currentMemberId);
    
    if (!member) {
        alert('会员不存在');
        window.close();
        return;
    }

    // 获取训练记录
    trainingRecords = DataManager.getMemberTrainingRecords(currentMemberId);
    
    if (trainingRecords.length === 0) {
        alert('该会员暂无训练记录');
        window.close();
        return;
    }

    // 生成报告内容
    generateMemberInfo();
    generateTrainingTable();
    generateMessage();
    setGenerateTime();
}

// 生成会员基本信息
function generateMemberInfo() {
    // 按日期排序训练记录
    const sortedRecords = [...trainingRecords].sort((a, b) => 
        new Date(a.trainingDateTime) - new Date(b.trainingDateTime)
    );

    // 获取开始和结束日期
    const startDate = new Date(sortedRecords[0].trainingDateTime);
    const endDate = new Date(sortedRecords[sortedRecords.length - 1].trainingDateTime);
    
    // 计算总天数
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    // 统计训练次数和请假次数
    const trainingCount = sortedRecords.filter(r => r.recordType === 'training' || !r.recordType).length;
    const leaveCount = sortedRecords.filter(r => r.recordType === 'leave').length;
    
    // 计算出勤率
    const attendanceRate = ((trainingCount / (trainingCount + leaveCount)) * 100).toFixed(1);

    const infoHtml = `
        <div class="info-row">
            <span class="info-label">👤 会员姓名</span>
            <span class="info-value highlight">${member.name}</span>
        </div>
        <div class="info-row">
            <span class="info-label">📅 包月开始日期</span>
            <span class="info-value">${formatDate(startDate)}</span>
        </div>
        <div class="info-row">
            <span class="info-label">📅 包月结束日期</span>
            <span class="info-value">${formatDate(endDate)}</span>
        </div>
        <div class="info-row">
            <span class="info-label">⏱️ 包月总计天数</span>
            <span class="info-value highlight">${totalDays} 天</span>
        </div>
        <div class="info-row">
            <span class="info-label">💪 训练次数</span>
            <span class="info-value">${trainingCount} 次</span>
        </div>
        <div class="info-row">
            <span class="info-label">📋 请假次数</span>
            <span class="info-value">${leaveCount} 次</span>
        </div>
        <div class="info-row">
            <span class="info-label">✅ 出勤率</span>
            <span class="info-value highlight">${attendanceRate}%</span>
        </div>
    `;

    document.getElementById('memberInfo').innerHTML = infoHtml;
}

// 生成训练记录表格
function generateTrainingTable() {
    // 按日期排序
    const sortedRecords = [...trainingRecords].sort((a, b) => 
        new Date(a.trainingDateTime) - new Date(b.trainingDateTime)
    );

    const tbody = document.getElementById('trainingTableBody');
    
    const rows = sortedRecords.map(record => {
        const date = new Date(record.trainingDateTime);
        const dateStr = formatDate(date);
        const weekDay = getWeekDay(date);
        
        // 判断是否为请假记录
        const isLeave = record.recordType === 'leave' || record.bodyPart === '请假有事';
        
        if (isLeave) {
            // 请假记录
            return `
                <tr>
                    <td>${dateStr}</td>
                    <td>${weekDay}</td>
                    <td><strong>请假</strong></td>
                    <td><span class="status-badge status-leave">请假</span></td>
                    <td>${record.leaveReason || '未填写'}</td>
                </tr>
            `;
        } else {
            // 正常训练记录
            const actions = record.actions && record.actions.length > 0 
                ? record.actions.join('、') 
                : '-';
            
            return `
                <tr>
                    <td>${dateStr}</td>
                    <td>${weekDay}</td>
                    <td><strong>${record.bodyPart}</strong></td>
                    <td><span class="status-badge status-training">训练</span></td>
                    <td>${actions}</td>
                </tr>
            `;
        }
    }).join('');

    tbody.innerHTML = rows;
}

// 生成未来寄语
function generateMessage() {
    // 计算训练次数
    const trainingCount = trainingRecords.filter(r => 
        r.recordType === 'training' || !r.recordType
    ).length;
    
    // 计算出勤率
    const totalRecords = trainingRecords.length;
    const attendanceRate = ((trainingCount / totalRecords) * 100).toFixed(1);
    
    // 根据出勤率和训练次数生成不同的寄语
    let message = '';
    
    if (attendanceRate >= 90) {
        message = `亲爱的${member.name}，您本月的出勤率高达${attendanceRate}%，完成了${trainingCount}次高质量训练！您的坚持和努力令人敬佩。继续保持这份热情，您的健康和体能将持续提升。记住：成功的秘诀在于坚持不懈！💪`;
    } else if (attendanceRate >= 75) {
        message = `${member.name}，您本月出勤率${attendanceRate}%，共完成${trainingCount}次训练，表现非常不错！继续保持这个节奏，您一定能达成自己的健身目标。每一次训练都是向更好的自己迈进一步！🌟`;
    } else if (attendanceRate >= 60) {
        message = `${member.name}，您本月的训练表现还不错，出勤率${attendanceRate}%。建议下个月更加规律地安排训练，这样效果会更明显。记住，健身贵在坚持，让我们一起加油！💪`;
    } else {
        message = `${member.name}，本月您的出勤率是${attendanceRate}%。我们理解生活中会有各种事情，但规律的训练对达成目标非常重要。下个月让我们一起制定一个更适合您的训练计划，相信您能做得更好！加油！🌈`;
    }

    const messageHtml = `
        <div class="message-title">✨ 未来寄语 ✨</div>
        <div class="message-content">${message}</div>
    `;

    document.getElementById('messageBox').innerHTML = messageHtml;
}

// 设置生成时间
function setGenerateTime() {
    const now = new Date();
    const timeStr = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('generateTime').textContent = timeStr;
}

// 格式化日期
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// 获取星期几
function getWeekDay(date) {
    const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return weekDays[date.getDay()];
}
