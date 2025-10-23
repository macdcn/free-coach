// ==================== 会员管理模块 ====================

// 全局变量
let currentMembers = [];

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initMembersPage();
});

// 初始化会员页面
function initMembersPage() {
    loadMembers();
    bindEvents();
}

// 绑定事件
function bindEvents() {
    // 添加会员按钮
    const addBtn = document.getElementById('addMemberBtn');
    if (addBtn) {
        addBtn.addEventListener('click', openAddMemberModal);
    }
}

// ==================== 会员列表渲染 ====================

// 加载会员列表
function loadMembers() {
    currentMembers = DataManager.getMembers();
    renderMembersList();
}

// 渲染会员列表
function renderMembersList() {
    const container = document.getElementById('membersList');
    
    if (currentMembers.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📋</div>
                <div class="empty-text">暂无会员信息<br>点击右下角按钮添加会员</div>
            </div>
        `;
        return;
    }

    container.innerHTML = currentMembers.map(member => createMemberCard(member)).join('');
}

// 创建会员卡片
function createMemberCard(member) {
    const status = DataManager.getMemberStatus(member);
    const venueStatus = DataManager.getVenueStatus(member);
    
    // 头像状态样式
    const avatarClass = status === 'active' ? 'avatar-active' : 
                       status === 'warning' ? 'avatar-warning' : 'avatar-expired';
    
    // 场地费状态标签
    const venueBadge = {
        'settled': '<span class="venue-badge venue-settled">已结清</span>',
        'unsettled': '<span class="venue-badge venue-unsettled">未结算</span>',
        'partial': '<span class="venue-badge venue-partial">部分结</span>'
    }[venueStatus];

    // 默认头像 - 使用SVG图标而不是文字
    const avatarUrl = member.avatar && member.avatar.trim() !== '' 
        ? member.avatar 
        : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"%3E%3Crect fill="%238B9DC3" width="128" height="128"/%3E%3Cpath fill="%23FFFFFF" d="M64 14c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm0 92c-18.778 0-35.5-9.6-45.25-24.167C28.722 72.5 46.444 66 64 66s35.278 6.5 45.25 15.833C99.5 96.4 82.778 106 64 106z"/%3E%3C/svg%3E';

    return `
        <div class="member-card">
            <div class="member-card-header">
                <div class="avatar-container">
                    <img src="${avatarUrl}" alt="${member.name}" class="member-avatar ${avatarClass}" onclick="viewTrainingRecords(${member.id})">
                    ${venueBadge}
                </div>
                <div class="member-info">
                    <div class="member-name">${member.name}</div>
                    <div class="member-phone">${member.phone}</div>
                    <span class="member-gender">${member.gender}</span>
                </div>
            </div>

            <div class="member-details">
                <div class="detail-row">
                    <span class="detail-label">私教类型</span>
                    <span class="detail-value">${member.type}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">包月费用</span>
                    <span class="detail-value">¥${member.remainingAmount.toFixed(2)}</span>
                </div>
                
                <!-- 课时进度条 -->
                <div class="detail-row course-progress-row">
                    <span class="detail-label">剩余课时</span>
                    <div class="progress-wrapper">
                        <div class="progress-bar-container">
                            <div class="progress-bar progress-${status}" style="width: ${Math.round((member.remainingCourses / member.totalCourses) * 100)}%">
                                <span class="progress-text">${member.totalCourses - member.remainingCourses}/${member.totalCourses}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="detail-row">
                    <span class="detail-label">场地费方式</span>
                    <span class="detail-value">${member.venueMethod}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">收费日期</span>
                    <span class="detail-value">${DataManager.formatDate(member.paymentDate)}</span>
                </div>
                ${member.renewCount > 0 ? `
                <div class="detail-row">
                    <span class="detail-label">续费次数</span>
                    <span class="detail-value">
                        ${member.renewCount}次
                        <span class="renew-count">已续费</span>
                    </span>
                </div>
                ` : ''}
            </div>

            ${member.note ? `<div class="member-note">📝 ${member.note}</div>` : ''}

            <div class="member-actions">
                <button class="action-btn btn-renew" data-tooltip="续费" onclick="openRenewModal(${member.id})">
                    💰
                </button>
                <button class="action-btn btn-edit" data-tooltip="修改" onclick="openEditMemberModal(${member.id})">
                    ✏️
                </button>
                <button class="action-btn btn-training" data-tooltip="训练" onclick="viewTrainingRecords(${member.id})">
                    🏋️
                </button>
                <button class="action-btn btn-report" data-tooltip="报告" onclick="exportTrainingReport(${member.id})">
                    📊
                </button>
                <button class="action-btn btn-delete" data-tooltip="删除" onclick="confirmDeleteMember(${member.id})">
                    🗑️
                </button>
            </div>
        </div>
    `;
}

// ==================== 添加会员 ====================

// 打开添加会员模态框
function openAddMemberModal() {
    showModal(Templates.memberFormModal());
}

// 打开编辑会员模态框
function openEditMemberModal(memberId) {
    const member = DataManager.getMemberById(memberId);
    if (member) {
        showModal(Templates.memberFormModal(member));
    }
}

// 提交会员表单
function submitMemberForm(memberId) {
    // 获取表单数据
    const name = document.getElementById('memberName').value.trim();
    const phone = document.getElementById('memberPhone').value.trim();
    const gender = document.getElementById('memberGender').value;
    const type = document.getElementById('memberType').value;
    const amount = parseFloat(document.getElementById('memberAmount').value);
    const courses = parseInt(document.getElementById('memberCourses').value);
    const paymentDate = document.getElementById('memberDate').value;
    const venueMethod = document.getElementById('memberVenueMethod').value;
    const note = document.getElementById('memberNote').value.trim();
    const avatar = document.getElementById('avatarPreview').src;

    // 验证必填字段
    if (!name) {
        showToast('请输入会员姓名');
        return;
    }
    
    if (!phone) {
        showToast('请输入手机号码');
        return;
    }
    
    if (!gender) {
        showToast('请选择性别');
        return;
    }
    
    if (!type) {
        showToast('请选择私教类型');
        return;
    }
    
    if (!amount || isNaN(amount)) {
        showToast('请输入有效的金额');
        return;
    }
    
    if (!courses || isNaN(courses)) {
        showToast('请输入有效的课时数');
        return;
    }
    
    if (!paymentDate) {
        showToast('请选择收费日期');
        return;
    }
    
    if (!venueMethod) {
        showToast('请选择场地费方式');
        return;
    }

    // 验证手机号格式
    if (!DataManager.validatePhone(phone)) {
        showToast('请输入正确的手机号码（11位数字）');
        return;
    }
    
    // 验证电话是否重复（编辑时排除自己）
    if (DataManager.isPhoneExists(phone, memberId)) {
        showToast('该手机号码已被其他会员使用，请更换');
        return;
    }

    // 验证金额和课时
    if (amount <= 0) {
        showToast('金额必须大于0');
        return;
    }
    
    if (courses <= 0) {
        showToast('课时数必须大于0');
        return;
    }
    
    // 验证姓名长度
    if (name.length < 2 || name.length > 20) {
        showToast('姓名长度应在2-20个字符之间');
        return;
    }

    const memberData = {
        name,
        phone,
        gender,
        type,
        amount,
        courses,
        paymentDate,
        venueMethod,
        note,
        avatar: avatar.startsWith('data:') ? avatar : (avatar.includes('ui-avatars.com') ? '' : avatar)
    };

    // 添加或更新会员
    if (memberId) {
        // 编辑模式
        const existingMember = DataManager.getMemberById(memberId);
        DataManager.updateMember(memberId, {
            ...memberData,
            // 保留原有的统计数据
            remainingCourses: existingMember.remainingCourses + (courses - existingMember.courses),
            totalCourses: existingMember.totalCourses + (courses - existingMember.courses),
            remainingAmount: existingMember.remainingAmount + (amount - existingMember.amount),
            totalAmount: existingMember.totalAmount + (amount - existingMember.amount),
        });
        showToast('会员信息更新成功');
    } else {
        // 新增模式
        DataManager.addMember(memberData);
        showToast('会员添加成功');
    }

    closeModal();
    loadMembers();
}

// ==================== 会员续费 ====================

// 打开续费模态框
function openRenewModal(memberId = null) {
    showModal(Templates.renewModal());
    
    // 如果指定了会员ID，自动选中
    if (memberId) {
        setTimeout(() => {
            const select = document.getElementById('renewMemberId');
            if (select) {
                select.value = memberId;
            }
        }, 0);
    }
}

// 提交续费表单
function submitRenewForm() {
    const memberId = parseInt(document.getElementById('renewMemberId').value);
    const amount = parseFloat(document.getElementById('renewAmount').value);
    const courses = parseInt(document.getElementById('renewCourses').value);
    const renewDate = document.getElementById('renewDate').value;

    // 验证必填字段
    if (!memberId || !amount || !courses || !renewDate) {
        showToast('请填写所有必填项');
        return;
    }

    if (amount <= 0 || courses <= 0) {
        showToast('续费金额和课时必须大于0');
        return;
    }

    // 执行续费
    const result = DataManager.renewMember(memberId, {
        amount,
        courses,
        renewDate
    });

    if (result) {
        showToast('续费成功');
        closeModal();
        loadMembers();
    } else {
        showToast('续费失败，请重试');
    }
}

// ==================== 删除会员 ====================

// 确认删除会员
function confirmDeleteMember(memberId) {
    const member = DataManager.getMemberById(memberId);
    if (!member) return;

    showModal(Templates.confirmDeleteModal(member.name));

    // 绑定确认删除按钮事件
    setTimeout(() => {
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        if (confirmBtn) {
            confirmBtn.onclick = () => deleteMember(memberId);
        }
    }, 0);
}

// 删除会员
function deleteMember(memberId) {
    DataManager.deleteMember(memberId);
    showToast('会员已删除');
    closeModal();
    loadMembers();
}

// ==================== 训练记录 ====================

// 打开添加训练记录模态框
function openAddTrainingModal(memberId) {
    const member = DataManager.getMemberById(memberId);
    
    // 检查会员是否有剩余课时
    if (member && member.remainingCourses <= 0) {
        showToast('该会员课时已用完，请先续费');
        return;
    }

    showModal(Templates.trainingFormModal(memberId));
}

// 查看训练记录
function viewTrainingRecords(memberId) {
    // 将会员ID存储到sessionStorage
    sessionStorage.setItem('currentMemberId', memberId);
    
    // 跳转到训练记录页面
    window.location.href = `training.html?memberId=${memberId}`;
}

// 显示训练记录页面（内嵌在同一页面）
function showTrainingRecordsPage(memberId, memberName) {
    const records = DataManager.getMemberTrainingRecords(memberId);
    
    const html = `
        <div class="modal-overlay" id="trainingRecordsModal">
            <div class="modal-content" style="max-width: 600px; max-height: 90vh;">
                <div class="modal-header">
                    <h2 class="modal-title">${memberName} 的训练记录</h2>
                </div>
                <div class="modal-body">
                    ${records.length === 0 ? `
                        <div class="empty-state">
                            <div class="empty-icon">📝</div>
                            <div class="empty-text">暂无训练记录</div>
                        </div>
                    ` : `
                        <div style="display: flex; flex-direction: column; gap: 12px;">
                            ${records.map(record => `
                                <div style="padding: 16px; background: var(--color-bg); border-radius: var(--border-radius-md); border-left: 4px solid var(--color-primary);">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                                        <span style="font-weight: 600; color: var(--color-text-primary);">
                                            ${DataManager.formatDate(record.trainingDate)}
                                        </span>
                                        <span style="color: var(--color-text-secondary); font-size: 14px;">
                                            ${record.duration}分钟
                                        </span>
                                    </div>
                                    <div style="color: var(--color-text-secondary); font-size: 14px; line-height: 1.6; margin-bottom: 8px;">
                                        ${record.content}
                                    </div>
                                    ${record.venueFee > 0 ? `
                                        <div style="font-size: 13px; color: var(--color-warning);">
                                            💰 场地费: ¥${record.venueFee.toFixed(2)}
                                        </div>
                                    ` : ''}
                                    ${record.note ? `
                                        <div style="font-size: 13px; color: var(--color-text-secondary); margin-top: 4px;">
                                            📝 ${record.note}
                                        </div>
                                    ` : ''}
                                </div>
                            `).reverse().join('')}
                        </div>
                    `}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="openAddTrainingModal(${memberId}); closeModal();">添加训练</button>
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">关闭</button>
                </div>
            </div>
        </div>
    `;
    
    showModal(html);
}

// ==================== 导出训练报告 ====================

// 导出训练报告
function exportTrainingReport(memberId) {
    const member = DataManager.getMemberById(memberId);
    if (!member) return;
    
    const trainings = DataManager.getMemberTrainingRecords(memberId);
    
    if (trainings.length === 0) {
        showToast('该会员暂无训练记录');
        return;
    }
    
    // 打开报告页面
    window.open(`training-report.html?memberId=${memberId}`, '_blank');
}
