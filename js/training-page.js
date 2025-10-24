// ==================== 训练记录页面逻辑 ====================

let currentMemberId = null;
let currentMember = null;
let trainingRecords = [];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initTrainingPage();
});

// 初始化训练记录页面
function initTrainingPage() {
    // 从URL参数或sessionStorage获取会员ID
    const urlParams = new URLSearchParams(window.location.search);
    currentMemberId = urlParams.get('memberId') || sessionStorage.getItem('currentMemberId');
    
    if (!currentMemberId) {
        showToast('未选择会员');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    currentMemberId = parseInt(currentMemberId);
    currentMember = DataManager.getMemberById(currentMemberId);
    
    if (!currentMember) {
        showToast('会员不存在');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        return;
    }

    // 更新页面标题
    document.getElementById('pageTitle').textContent = `${currentMember.name} 的训练记录`;
    
    // 加载训练记录
    loadTrainingRecords();
    
    // 绑定事件
    bindTrainingPageEvents();
}

// 绑定页面事件
function bindTrainingPageEvents() {
    const addBtn = document.getElementById('addTrainingBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openAddTrainingRecordModal());
    }
}

// 返回上一页
function goBack() {
    window.location.href = 'index.html';
}

// 加载训练记录
function loadTrainingRecords() {
    trainingRecords = DataManager.getMemberTrainingRecords(currentMemberId);
    renderTrainingRecords();
}

// 渲染训练记录列表
function renderTrainingRecords() {
    const container = document.getElementById('trainingRecordsList');
    
    if (trainingRecords.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📝</div>
                <div class="empty-text">暂无训练记录<br>点击右下角按钮添加训练记录</div>
            </div>
        `;
        return;
    }

    // 按日期倒序排列
    const sortedRecords = [...trainingRecords].sort((a, b) => {
        return new Date(b.trainingDateTime) - new Date(a.trainingDateTime);
    });

    container.innerHTML = sortedRecords.map(record => createTrainingRecordCard(record)).join('');
}

// 创建训练记录卡片
function createTrainingRecordCard(record) {
    const dateTime = new Date(record.trainingDateTime);
    const dateStr = dateTime.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
    });
    const timeStr = dateTime.toLocaleTimeString('zh-CN', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // 获取会员头像
    const avatarUrl = currentMember.avatar && currentMember.avatar.trim() !== '' 
        ? currentMember.avatar 
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"%3E%3Crect fill="%238B9DC3" width="128" height="128"/%3E%3Cpath fill="%23FFFFFF" d="M64 14c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm0 92c-18.778 0-35.5-9.6-45.25-24.167C28.722 72.5 46.444 66 64 66s35.278 6.5 45.25 15.833C99.5 96.4 82.778 106 64 106z"/%3E%3C/svg%3E';

    // 判断是否为请假记录
    const isLeave = record.recordType === 'leave' || record.bodyPart === '请假有事';
    
    if (isLeave) {
        // 请假记录显示
        return `
            <div class="training-record-card leave-record">
                <div class="training-card-header" style="border-left-color: #9E9E9E; background: linear-gradient(135deg, #F5F5F5, #EEEEEE);">
                    <div class="training-header-left">
                        <img src="${avatarUrl}" alt="${currentMember.name}" class="training-member-avatar">
                        <div class="training-date-time">
                            <span class="training-date">${dateStr}</span>
                            <span class="training-time">${timeStr}</span>
                        </div>
                    </div>
                    <div class="training-body-part" style="background: #9E9E9E;">
                        📅 请假有事
                    </div>
                </div>
                
                <div class="training-card-body">
                    <div class="training-notes">
                        <div class="training-label">请假原因：</div>
                        <div class="training-notes-content">${record.leaveReason || '未填写'}</div>
                    </div>
                </div>
                
                <div class="training-card-footer">
                    <button class="training-action-btn" onclick="deleteTrainingRecord(${record.id})" data-tooltip="删除">
                        🗑️
                    </button>
                </div>
            </div>
        `;
    }
    
    // 正常训练记录显示
    const bodyPartColor = TrainingData.getBodyPartColor(record.bodyPart);
    const bodyPartIcon = TrainingData.getBodyPartIcon(record.bodyPart);

    return `
        <div class="training-record-card">
            <div class="training-card-header" style="border-left-color: ${bodyPartColor};">
                <div class="training-header-left">
                    <img src="${avatarUrl}" alt="${currentMember.name}" class="training-member-avatar">
                    <div class="training-date-time">
                        <span class="training-date">${dateStr}</span>
                        <span class="training-time">${timeStr}</span>
                    </div>
                </div>
                <div class="training-body-part" style="background: ${bodyPartColor};">
                    ${bodyPartIcon} ${record.bodyPart}
                </div>
            </div>
            
            <div class="training-card-body">
                <div class="training-actions-list">
                    <div class="training-label">训练动作：</div>
                    <div class="training-actions-tags">
                        ${record.actions.map(action => `
                            <span class="action-tag" style="border-color: ${bodyPartColor}; color: ${bodyPartColor};">
                                ${action}
                            </span>
                        `).join('')}
                    </div>
                </div>
                
                ${record.notes ? `
                    <div class="training-notes">
                        <div class="training-label">备注：</div>
                        <div class="training-notes-content">${record.notes}</div>
                    </div>
                ` : ''}
            </div>
            
            <div class="training-card-footer">
                <button class="training-action-btn" onclick="editTrainingRecord(${record.id})" data-tooltip="编辑">
                    ✏️
                </button>
                <button class="training-action-btn" onclick="deleteTrainingRecord(${record.id})" data-tooltip="删除">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

// 打开添加训练记录模态框
function openAddTrainingRecordModal() {
    // 检查会员课时
    if (currentMember.remainingCourses <= 0) {
        showToast('该会员课时已用完，请先续费');
        return;
    }

    showModal(getTrainingRecordFormModal());
    
    // 初始化表单事件
    setTimeout(() => {
        initTrainingFormEvents();
    }, 100);
}

// 获取训练记录表单模态框HTML
function getTrainingRecordFormModal(record = null) {
    const isEdit = record !== null;
    const title = isEdit ? '编辑训练记录' : '添加训练记录';
    
    const bodyParts = TrainingData.getAllBodyParts();
    
    // 获取会员头像
    const avatarUrl = currentMember.avatar && currentMember.avatar.trim() !== '' 
        ? currentMember.avatar 
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"%3E%3Crect fill="%238B9DC3" width="128" height="128"/%3E%3Cpath fill="%23FFFFFF" d="M64 14c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm0 92c-18.778 0-35.5-9.6-45.25-24.167C28.722 72.5 46.444 66 64 66s35.278 6.5 45.25 15.833C99.5 96.4 82.778 106 64 106z"/%3E%3C/svg%3E';
    
    return `
        <div class="modal-overlay" id="trainingRecordModal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="modal-title">${title}</h2>
                </div>
                <div class="modal-body">
                    <form id="trainingRecordForm">
                        <!-- 会员信息（头像+姓名） -->
                        <div class="form-group">
                            <label class="form-label">会员信息</label>
                            <div class="member-info-display">
                                <img src="${avatarUrl}" alt="${currentMember.name}" class="form-member-avatar">
                                <div class="form-member-details">
                                    <div class="form-member-name">${currentMember.name}</div>
                                    <div class="form-member-phone">${currentMember.phone}</div>
                                </div>
                            </div>
                        </div>

                        <!-- 记录类型 -->
                        <div class="form-group">
                            <label class="form-label">记录类型 *</label>
                            <div class="record-type-selector">
                                <label class="record-type-option">
                                    <input type="radio" name="recordType" value="training" checked onchange="handleRecordTypeChange()">
                                    <span class="record-type-text">🏋️ 正常训练</span>
                                </label>
                                <label class="record-type-option">
                                    <input type="radio" name="recordType" value="leave" onchange="handleRecordTypeChange()">
                                    <span class="record-type-text">📅 请假有事</span>
                                </label>
                            </div>
                        </div>

                        <!-- 训练日期时间 -->
                        <div class="form-group">
                            <label class="form-label" id="dateTimeLabel">训练日期时间 *</label>
                            <input type="datetime-local" id="trainingDateTime" class="form-input" 
                                value="${record?.trainingDateTime || new Date().toISOString().slice(0, 16)}" required>
                        </div>

                        <!-- 训练部位（仅正常训练） -->
                        <div class="form-group" id="bodyPartGroup">
                            <label class="form-label">训练部位 *</label>
                            <select id="trainingBodyPart" class="form-select" required>
                                <option value="">请选择训练部位</option>
                                ${bodyParts.map(part => `
                                    <option value="${part}" ${record?.bodyPart === part ? 'selected' : ''}>
                                        ${TrainingData.getBodyPartIcon(part)} ${part}
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- 训练动作（多选，仅正常训练） -->
                        <div class="form-group" id="actionsGroup">
                            <label class="form-label">训练动作 *</label>
                            <div id="trainingActionsContainer" class="actions-checkbox-group">
                                <p class="text-sm text-gray-500">请先选择训练部位</p>
                            </div>
                        </div>

                        <!-- 请假原因（仅请假有事） -->
                        <div class="form-group" id="leaveReasonGroup" style="display: none;">
                            <label class="form-label">请假原因 *</label>
                            <textarea id="leaveReason" class="form-textarea" 
                                placeholder="请输入请假或有事的原因"></textarea>
                        </div>

                        <!-- 备注（仅正常训练） -->
                        <div class="form-group" id="notesGroup">
                            <label class="form-label">备注</label>
                            <textarea id="trainingNotes" class="form-textarea" 
                                placeholder="请输入备注（可选）">${record?.notes || ''}</textarea>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="submitTrainingRecordForm(${record?.id || null})">确定</button>
                </div>
            </div>
        </div>
    `;
}

// 初始化训练表单事件
function initTrainingFormEvents() {
    const bodyPartSelect = document.getElementById('trainingBodyPart');
    if (bodyPartSelect) {
        bodyPartSelect.addEventListener('change', handleBodyPartChange);
        
        // 如果已选择部位，触发变更
        if (bodyPartSelect.value) {
            handleBodyPartChange.call(bodyPartSelect);
        }
    }
}

// 处理记录类型变更
function handleRecordTypeChange() {
    const recordType = document.querySelector('input[name="recordType"]:checked').value;
    const bodyPartGroup = document.getElementById('bodyPartGroup');
    const actionsGroup = document.getElementById('actionsGroup');
    const leaveReasonGroup = document.getElementById('leaveReasonGroup');
    const notesGroup = document.getElementById('notesGroup');
    const dateTimeLabel = document.getElementById('dateTimeLabel');
    const bodyPartSelect = document.getElementById('trainingBodyPart');
    const leaveReasonTextarea = document.getElementById('leaveReason');
    
    if (recordType === 'training') {
        // 正常训练：显示训练相关字段
        bodyPartGroup.style.display = '';
        actionsGroup.style.display = '';
        leaveReasonGroup.style.display = 'none';
        notesGroup.style.display = '';
        dateTimeLabel.textContent = '训练日期时间 *';
        
        // 设置必填
        bodyPartSelect.required = true;
        leaveReasonTextarea.required = false;
    } else {
        // 请假有事：隐藏训练字段和备注，显示请假原因
        bodyPartGroup.style.display = 'none';
        actionsGroup.style.display = 'none';
        leaveReasonGroup.style.display = '';
        notesGroup.style.display = 'none';
        dateTimeLabel.textContent = '请假日期 *';
        
        // 设置必填
        bodyPartSelect.required = false;
        leaveReasonTextarea.required = true;
    }
}

// 处理训练部位变更
function handleBodyPartChange() {
    const bodyPart = this.value;
    const container = document.getElementById('trainingActionsContainer');
    
    if (!bodyPart) {
        container.innerHTML = '<p class="text-sm text-gray-500">请先选择训练部位</p>';
        return;
    }

    const actions = TrainingData.getActionsByBodyPart(bodyPart);
    const bodyPartColor = TrainingData.getBodyPartColor(bodyPart);
    
    container.innerHTML = actions.map((action, index) => `
        <label class="action-checkbox-label">
            <input type="checkbox" name="trainingActions" value="${action}" class="action-checkbox">
            <span class="action-checkbox-text" style="border-color: ${bodyPartColor};">${action}</span>
        </label>
    `).join('');
}

// 提交训练记录表单
function submitTrainingRecordForm(recordId) {
    const recordType = document.querySelector('input[name="recordType"]:checked').value;
    const dateTime = document.getElementById('trainingDateTime').value;
    const notes = document.getElementById('trainingNotes').value.trim();
    
    // 验证日期
    if (!dateTime) {
        showToast('请选择日期时间');
        return;
    }
    
    let recordData = {
        memberId: currentMemberId,
        memberName: currentMember.name,
        trainingDateTime: dateTime,
        notes: notes,
        venueSettled: currentMember.venueMethod === '一次性', // 一次性结算的会员，新增记录自动标记为已结
        recordType: recordType // 记录类型：training 或 leave
    };
    
    if (recordType === 'training') {
        // 正常训练：验证训练相关字段
        const bodyPart = document.getElementById('trainingBodyPart').value;
        const selectedActions = Array.from(document.querySelectorAll('input[name="trainingActions"]:checked'))
            .map(cb => cb.value);

        if (!bodyPart) {
            showToast('请选择训练部位');
            return;
        }

        if (selectedActions.length === 0) {
            showToast('请至少选择一个训练动作');
            return;
        }
        
        recordData.bodyPart = bodyPart;
        recordData.actions = selectedActions;
    } else {
        // 请假有事：验证请假原因
        const leaveReason = document.getElementById('leaveReason').value.trim();
        
        if (!leaveReason) {
            showToast('请输入请假原因');
            return;
        }
        
        recordData.bodyPart = '请假有事'; // 特殊标记
        recordData.actions = [];
        recordData.leaveReason = leaveReason;
    }

    if (recordId) {
        // 编辑模式（暂不实现，需要在data.js中添加更新方法）
        showToast('编辑功能开发中');
    } else {
        // 新增模式
        DataManager.addTrainingRecord(recordData);
        showToast(recordType === 'training' ? '训练记录添加成功' : '请假记录添加成功');
        closeModal();
        loadTrainingRecords();
    }
}

// 编辑训练记录
function editTrainingRecord(recordId) {
    const record = trainingRecords.find(r => r.id === recordId);
    if (!record) return;

    showModal(getTrainingRecordFormModal(record));
    
    setTimeout(() => {
        initTrainingFormEvents();
        
        // 恢复选中的动作
        record.actions.forEach(action => {
            const checkbox = document.querySelector(`input[name="trainingActions"][value="${action}"]`);
            if (checkbox) {
                checkbox.checked = true;
            }
        });
    }, 100);
}

// 删除训练记录
function deleteTrainingRecord(recordId) {
    const record = trainingRecords.find(r => r.id === recordId);
    if (!record) return;

    const confirmHtml = `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2 class="modal-title">确认删除</h2>
                </div>
                <div class="modal-body">
                    <p style="font-size: 15px; color: var(--color-text-secondary); line-height: 1.8;">
                        确定要删除这条训练记录吗？<br>
                        此操作无法恢复。
                    </p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button type="button" class="btn btn-delete" onclick="confirmDeleteTrainingRecord(${recordId})">确定删除</button>
                </div>
            </div>
        </div>
    `;

    showModal(confirmHtml);
}

// 确认删除训练记录
function confirmDeleteTrainingRecord(recordId) {
    // 获取要删除的记录
    const record = trainingRecords.find(r => r.id === recordId);
    const isLeave = record && (record.recordType === 'leave' || record.bodyPart === '请假有事');
    
    DataManager.deleteTrainingRecord(recordId);
    
    // 仅当删除的是正常训练记录时才恢复会员课时（请假记录不扣课时，所以也不恢复）
    if (!isLeave) {
        const member = DataManager.getMemberById(currentMemberId);
        if (member) {
            DataManager.updateMember(currentMemberId, {
                remainingCourses: member.remainingCourses + 1
            });
            currentMember = DataManager.getMemberById(currentMemberId);
        }
    }
    
    showToast('训练记录已删除');
    closeModal();
    loadTrainingRecords();
}
