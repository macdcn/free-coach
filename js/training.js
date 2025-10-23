// ==================== 训练记录模块 ====================

// 提交训练记录表单
function submitTrainingForm() {
    // 获取表单数据
    const memberIdField = document.getElementById('trainingMemberId');
    const memberId = parseInt(memberIdField.value || memberIdField.getAttribute('data-member-id'));
    const trainingDate = document.getElementById('trainingDate').value;
    const content = document.getElementById('trainingContent').value.trim();
    const duration = parseInt(document.getElementById('trainingDuration').value);
    const venueFee = parseFloat(document.getElementById('trainingVenueFee').value) || 0;
    const note = document.getElementById('trainingNote').value.trim();

    // 验证必填字段
    if (!memberId || !trainingDate || !content || !duration) {
        showToast('请填写所有必填项');
        return;
    }

    if (duration <= 0) {
        showToast('训练时长必须大于0');
        return;
    }

    // 检查会员是否存在
    const member = DataManager.getMemberById(memberId);
    if (!member) {
        showToast('会员不存在');
        return;
    }

    // 检查剩余课时
    if (member.remainingCourses <= 0) {
        showToast('该会员课时已用完，无法添加训练记录');
        return;
    }

    const recordData = {
        memberId,
        memberName: member.name,
        trainingDate,
        content,
        duration,
        venueFee,
        note
    };

    // 添加训练记录
    DataManager.addTrainingRecord(recordData);
    showToast('训练记录添加成功');
    closeModal();
    
    // 刷新会员列表（如果在会员管理页面）
    if (typeof loadMembers === 'function') {
        loadMembers();
    }
}

// ==================== 训练记录查询和统计 ====================

// 获取会员的训练统计
function getMemberTrainingStats(memberId) {
    const records = DataManager.getMemberTrainingRecords(memberId);
    
    const stats = {
        totalRecords: records.length,
        totalDuration: records.reduce((sum, r) => sum + (r.duration || 0), 0),
        totalVenueFee: records.reduce((sum, r) => sum + (r.venueFee || 0), 0),
        lastTrainingDate: records.length > 0 ? records[records.length - 1].trainingDate : null
    };

    return stats;
}

// 导出训练记录（可选功能，用于未来扩展）
function exportTrainingRecords(memberId) {
    const member = DataManager.getMemberById(memberId);
    if (!member) return;

    const records = DataManager.getMemberTrainingRecords(memberId);
    
    // 生成CSV格式的数据
    let csv = '训练日期,训练内容,训练时长(分钟),场地费,备注\n';
    records.forEach(record => {
        csv += `${DataManager.formatDate(record.trainingDate)},"${record.content}",${record.duration},${record.venueFee},"${record.note || ''}"\n`;
    });

    // 下载CSV文件
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${member.name}_训练记录_${new Date().toLocaleDateString()}.csv`);
    link.click();
    URL.revokeObjectURL(url);
    
    showToast('训练记录已导出');
}

// ==================== 场地费结算功能 ====================

// 结算场地费（用于10次一结的方式）
function settleVenueFee(memberId) {
    const member = DataManager.getMemberById(memberId);
    if (!member) return;

    if (member.venueMethod !== '10次一结') {
        showToast('该会员采用一次性场地费，无需结算');
        return;
    }

    const usedCourses = member.totalCourses - member.remainingCourses;
    const settledTimes = member.venueSettledTimes || 0;
    const unsettledCourses = usedCourses - (settledTimes * 10);

    if (unsettledCourses < 10 && member.remainingCourses > 0) {
        showToast(`当前未结算课时为${unsettledCourses}次，满10次后可结算`);
        return;
    }

    // 确认结算
    const settleCount = Math.floor(unsettledCourses / 10);
    if (confirm(`确认结算${settleCount * 10}次课程的场地费吗？`)) {
        DataManager.updateMember(memberId, {
            venueSettledTimes: settledTimes + settleCount
        });
        showToast('场地费结算成功');
        
        // 刷新会员列表
        if (typeof loadMembers === 'function') {
            loadMembers();
        }
    }
}

// 获取场地费结算信息
function getVenueSettlementInfo(memberId) {
    const member = DataManager.getMemberById(memberId);
    if (!member) return null;

    if (member.venueMethod === '一次性') {
        return {
            method: '一次性',
            status: '已结清',
            settled: true
        };
    }

    const usedCourses = member.totalCourses - member.remainingCourses;
    const settledTimes = member.venueSettledTimes || 0;
    const settledCourses = settledTimes * 10;
    const unsettledCourses = usedCourses - settledCourses;

    return {
        method: '10次一结',
        usedCourses,
        settledTimes,
        settledCourses,
        unsettledCourses,
        canSettle: unsettledCourses >= 10,
        status: member.remainingCourses <= 0 ? '已结清' : 
                unsettledCourses === 0 ? '已结清' :
                settledTimes > 0 ? '部分结算' : '未结算'
    };
}
