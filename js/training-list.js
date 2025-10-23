// ==================== 场地费结算页面逻辑 ====================

let currentFilter = ''; // 当前筛选条件

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadTrainingMembersList();
});

// 按场地费方式筛选
function filterByVenueMethod() {
    currentFilter = document.getElementById('venueMethodFilter').value;
    loadTrainingMembersList();
}

// 加载会员列表（训练记录视图）
function loadTrainingMembersList() {
    let members = DataManager.getMembers();
    const container = document.getElementById('trainingMembersList');
    
    // 按筛选条件过滤
    if (currentFilter) {
        members = members.filter(m => m.venueMethod === currentFilter);
    }
    
    if (members.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">👥</div>
                <div class="empty-text">暂无符合条件的会员</div>
            </div>
        `;
        return;
    }

    // 为每个会员获取训练记录
    const membersWithTrainingData = members.map(member => {
        const trainings = DataManager.getMemberTrainingRecords(member.id);
        const unsettledCount = trainings.filter(t => !t.venueSettled).length;
        const settledCount = trainings.filter(t => t.venueSettled).length;
        
        return {
            ...member,
            trainingCount: trainings.length,
            unsettledCount,
            settledCount,
            trainings
        };
    });

    // 按未结算数量倒序排列
    membersWithTrainingData.sort((a, b) => b.unsettledCount - a.unsettledCount);

    container.innerHTML = membersWithTrainingData.map(member => createTrainingMemberCard(member)).join('');
}

// 创建训练会员卡片
function createTrainingMemberCard(member) {
    const avatarUrl = member.avatar && member.avatar.trim() !== '' 
        ? member.avatar 
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"%3E%3Crect fill="%238B9DC3" width="128" height="128"/%3E%3Cpath fill="%23FFFFFF" d="M64 14c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm0 92c-18.778 0-35.5-9.6-45.25-24.167C28.722 72.5 46.444 66 64 66s35.278 6.5 45.25 15.833C99.5 96.4 82.778 106 64 106z"/%3E%3C/svg%3E';

    // 获取会员场地费结算状态
    const venueStatus = DataManager.getVenueStatus(member);
    const venueBadge = {
        'settled': '<span class="venue-badge venue-settled">已结清</span>',
        'unsettled': '<span class="venue-badge venue-unsettled">未结算</span>',
        'partial': '<span class="venue-badge venue-partial">部分结</span>'
    }[venueStatus];

    return `
        <div class="member-card" onclick="viewMemberTrainingRecords(${member.id})">
            <div class="member-header">
                <div class="member-avatar-wrapper">
                    <img src="${avatarUrl}" alt="${member.name}" class="member-avatar">
                    ${venueBadge}
                </div>
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div style="font-size: 13px; color: var(--color-text-secondary); margin-top: 4px;">
                        场地费方式：${member.venueMethod}
                    </div>
                </div>
            </div>
            <div class="member-details">
                <div class="detail-row">
                    <span class="detail-label">训练记录：</span>
                    <span class="detail-value">${member.trainingCount} 次</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">未结算：</span>
                    <span class="detail-value" style="color: ${member.unsettledCount > 0 ? '#f44336' : '#4CAF50'}; font-weight: 600;">
                        ${member.unsettledCount} 次
                    </span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">已结算：</span>
                    <span class="detail-value">${member.settledCount} 次</span>
                </div>
            </div>
        </div>
    `;
}

// 查看会员训练记录详情
function viewMemberTrainingRecords(memberId) {
    const member = DataManager.getMemberById(memberId);
    if (!member) return;
    
    const trainings = DataManager.getMemberTrainingRecords(memberId);
    
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h2 class="modal-title">${member.name} - 训练记录</h2>
                </div>
                <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                    ${trainings.length === 0 ? `
                        <div class="empty-state" style="padding: 40px 20px;">
                            <div class="empty-icon" style="font-size: 48px;">🏋️</div>
                            <div class="empty-text">暂无训练记录</div>
                        </div>
                    ` : `
                        <div class="training-records-list">
                            ${trainings.map(t => createTrainingRecordItem(t, member)).join('')}
                        </div>
                    `}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">关闭</button>
                    ${member.venueMethod === '一次性' && trainings.some(t => !t.venueSettled) ? `
                        <button type="button" class="btn btn-primary" onclick="settleMemberVenue(${memberId})">结算场地费</button>
                    ` : ''}
                    ${member.venueMethod === '10次一结' && trainings.filter(t => !t.venueSettled).length >= 10 ? `
                        <button type="button" class="btn btn-primary" onclick="settle10TimesVenue(${memberId})">结算10次</button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    showModal(modalHtml);
}

// 创建训练记录项
function createTrainingRecordItem(training, member) {
    const dateTime = new Date(training.trainingDateTime);
    const dateStr = dateTime.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });
    
    const avatarUrl = member.avatar && member.avatar.trim() !== '' 
        ? member.avatar 
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"%3E%3Crect fill="%238B9DC3" width="128" height="128"/%3E%3Cpath fill="%23FFFFFF" d="M64 14c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm0 92c-18.778 0-35.5-9.6-45.25-24.167C28.722 72.5 46.444 66 64 66s35.278 6.5 45.25 15.833C99.5 96.4 82.778 106 64 106z"/%3E%3C/svg%3E';
    
    return `
        <div class="training-record-item" style="display: flex; gap: 12px; padding: 12px; background: linear-gradient(135deg, #FFFFFF, #F8F6F3); border-radius: 8px; margin-bottom: 10px; border: 1px solid var(--color-secondary-light);">
            <div class="training-avatar-wrapper" style="position: relative;">
                <img src="${avatarUrl}" alt="${member.name}" style="width: 48px; height: 48px; border-radius: 50%; object-fit: cover; border: 2px solid var(--color-secondary-light);">
                ${training.venueSettled ? '<div class="venue-settled-badge" style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); background: #4CAF50; color: white; font-size: 10px; padding: 2px 6px; border-radius: 10px; white-space: nowrap;">已结</div>' : ''}
            </div>
            <div style="flex: 1;">
                <div style="font-size: 14px; font-weight: 500; color: var(--color-text-primary); margin-bottom: 4px;">
                    ${training.bodyPart} - ${dateStr}
                </div>
                <div style="font-size: 12px; color: var(--color-text-secondary);">
                    ${training.actions.join('、')}
                </div>
            </div>
        </div>
    `;
}

// 打开批量结算模态框
function openSettlementModal() {
    const filter = currentFilter;
    
    if (!filter) {
        showToast('请先选择结算方式（一次性成10次一结）');
        return;
    }
    
    let members = DataManager.getMembers().filter(m => m.venueMethod === filter);
    
    if (filter === '一次性') {
        // 筛选有未结算记录的会员
        members = members.filter(m => {
            const trainings = DataManager.getMemberTrainingRecords(m.id);
            return trainings.some(t => !t.venueSettled);
        });
    } else if (filter === '10次一结') {
        // 筛选未结算记录达到10次的会员
        members = members.filter(m => {
            const trainings = DataManager.getMemberTrainingRecords(m.id);
            const unsettled = trainings.filter(t => !t.venueSettled);
            return unsettled.length >= 10;
        });
    }
    
    if (members.length === 0) {
        showToast('暂无需要结算的会员');
        return;
    }
    
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 450px;">
                <div class="modal-header">
                    <h2 class="modal-title">批量结算场地费</h2>
                </div>
                <div class="modal-body">
                    <p style="font-size: 15px; color: var(--color-text-secondary); line-height: 1.8; margin-bottom: 16px;">
                        将对以下 <strong style="color: var(--color-primary);">${members.length}</strong> 名会员进行场地费结算：
                    </p>
                    <div style="max-height: 250px; overflow-y: auto; padding: 12px; background: #F8F6F3; border-radius: 8px;">
                        ${members.map(m => {
                            const trainings = DataManager.getMemberTrainingRecords(m.id);
                            const unsettled = trainings.filter(t => !t.venueSettled).length;
                            return `
                                <div style="padding: 8px; margin-bottom: 6px; background: white; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                                    <span style="font-size: 14px; color: var(--color-text-primary);">${m.name}</span>
                                    <span style="font-size: 12px; color: var(--color-text-secondary);">未结: ${unsettled}次</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    <p style="font-size: 13px; color: var(--color-text-secondary); margin-top: 12px;">
                        ${filter === '一次性' ? '将结算所有训练记录的场地费' : '将结算每位会员的10次训练记录'}
                    </p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="confirmBatchSettlement()">确认结算</button>
                </div>
            </div>
        </div>
    `;
    
    showModal(modalHtml);
}

// 确认批量结算
function confirmBatchSettlement() {
    const filter = currentFilter;
    let members = DataManager.getMembers().filter(m => m.venueMethod === filter);
    let settledCount = 0;
    
    members.forEach(member => {
        if (filter === '一次性') {
            const result = settleMemberVenue(member.id, true);
            if (result) settledCount++;
        } else if (filter === '10次一结') {
            const result = settle10TimesVenue(member.id, true);
            if (result) settledCount++;
        }
    });
    
    closeModal();
    showToast(`成功结算 ${settledCount} 名会员的场地费`);
    loadTrainingMembersList();
}

// 结算会员场地费（一次性）
function settleMemberVenue(memberId, silent = false) {
    const member = DataManager.getMemberById(memberId);
    if (!member || member.venueMethod !== '一次性') return false;
    
    const trainings = DataManager.getMemberTrainingRecords(memberId);
    const unsettled = trainings.filter(t => !t.venueSettled);
    
    if (unsettled.length === 0) {
        if (!silent) showToast('没有需要结算的记录');
        return false;
    }
    
    // 标记所有训练记录为已结算
    trainings.forEach(training => {
        DataManager.updateTrainingRecord(training.id, { venueSettled: true });
    });
    
    if (!silent) {
        closeModal();
        showToast('场地费结算成功');
        loadTrainingMembersList();
    }
    
    return true;
}

// 结算10次场地费
function settle10TimesVenue(memberId, silent = false) {
    const member = DataManager.getMemberById(memberId);
    if (!member || member.venueMethod !== '10次一结') return false;
    
    const trainings = DataManager.getMemberTrainingRecords(memberId);
    const unsettled = trainings.filter(t => !t.venueSettled);
    
    if (unsettled.length < 10) {
        if (!silent) showToast(`未结算记录不足10次，当前仅 ${unsettled.length} 次`);
        return false;
    }
    
    // 标记前10次为已结算
    unsettled.slice(0, 10).forEach(training => {
        DataManager.updateTrainingRecord(training.id, { venueSettled: true });
    });
    
    if (!silent) {
        closeModal();
        showToast('成功结算10次场地费');
        loadTrainingMembersList();
    }
    
    return true;
}

// Toast 提示
function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 2000);
}

// 显示模态框
function showModal(html) {
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container.firstElementChild);
}

// 关闭模态框
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.remove();
    }
}
