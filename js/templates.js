// ==================== HTML 模板管理 ====================

const Templates = {
    // 添加/编辑会员模态框
    memberFormModal(member = null) {
        const isEdit = member !== null;
        const title = isEdit ? '编辑会员' : '添加会员';
        
        return `
            <div class="modal-overlay" id="memberFormModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">${title}</h2>
                    </div>
                    <div class="modal-body">
                        <form id="memberForm">
                            <!-- 头像上传 -->
                            <div class="form-group">
                                <label class="form-label">会员头像</label>
                                <div class="avatar-upload">
                                    <img id="avatarPreview" src="${member?.avatar || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"%3E%3Crect fill="%238B9DC3" width="128" height="128"/%3E%3Cpath fill="%23FFFFFF" d="M64 14c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm0 92c-18.778 0-35.5-9.6-45.25-24.167C28.722 72.5 46.444 66 64 66s35.278 6.5 45.25 15.833C99.5 96.4 82.778 106 64 106z"/%3E%3C/svg%3E'}" alt="头像预览" class="avatar-preview">
                                    <input type="file" id="avatarInput" accept="image/*" style="display: none;">
                                    <button type="button" class="upload-btn" onclick="document.getElementById('avatarInput').click()">选择头像</button>
                                </div>
                            </div>

                            <!-- 姓名 -->
                            <div class="form-group">
                                <label class="form-label">姓名 *</label>
                                <input type="text" id="memberName" class="form-input" placeholder="请输入会员姓名" value="${member?.name || ''}" required>
                            </div>

                            <!-- 电话 -->
                            <div class="form-group">
                                <label class="form-label">电话 *</label>
                                <input type="tel" id="memberPhone" class="form-input" placeholder="请输入11位手机号码" value="${member?.phone || ''}" maxlength="11" required>
                                <small class="form-hint" id="phoneHint" style="display: none; color: var(--color-danger); font-size: 12px; margin-top: 4px;"></small>
                            </div>

                            <!-- 性别 -->
                            <div class="form-group">
                                <label class="form-label">性别 *</label>
                                <select id="memberGender" class="form-select" required>
                                    <option value="男" ${member?.gender === '男' ? 'selected' : ''}>男</option>
                                    <option value="女" ${member?.gender === '女' ? 'selected' : ''}>女</option>
                                </select>
                            </div>

                            <!-- 私教类型 -->
                            <div class="form-group">
                                <label class="form-label">私教类型 *</label>
                                <select id="memberType" class="form-select" required>
                                    <option value="包月" ${member?.type === '包月' ? 'selected' : ''}>包月</option>
                                    <option value="按次" ${member?.type === '按次' ? 'selected' : ''}>按次</option>
                                </select>
                            </div>

                            <!-- 收取金额 -->
                            <div class="form-group">
                                <label class="form-label">收取金额 *</label>
                                <input type="number" id="memberAmount" class="form-input" placeholder="请输入金额" value="${member?.amount || ''}" step="0.01" required>
                            </div>

                            <!-- 私教课数 -->
                            <div class="form-group">
                                <label class="form-label">私教课数 *</label>
                                <input type="number" id="memberCourses" class="form-input" placeholder="请输入课时数量" value="${member?.courses || ''}" required>
                            </div>

                            <!-- 收费日期 -->
                            <div class="form-group">
                                <label class="form-label">收费日期 *</label>
                                <input type="date" id="memberDate" class="form-input" value="${member?.paymentDate || new Date().toISOString().split('T')[0]}" required>
                            </div>

                            <!-- 场地费方式 -->
                            <div class="form-group">
                                <label class="form-label">场地费方式 *</label>
                                <select id="memberVenueMethod" class="form-select" required>
                                    <option value="一次性" ${member?.venueMethod === '一次性' ? 'selected' : ''}>一次性</option>
                                    <option value="10次一结" ${member?.venueMethod === '10次一结' ? 'selected' : ''}>10次一结</option>
                                </select>
                            </div>

                            <!-- 备注信息 -->
                            <div class="form-group">
                                <label class="form-label">备注信息</label>
                                <textarea id="memberNote" class="form-textarea" placeholder="请输入备注信息（可选）">${member?.note || ''}</textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                        <button type="button" class="btn btn-primary" onclick="submitMemberForm(${member?.id || null})">确定</button>
                    </div>
                </div>
            </div>
        `;
    },

    // 会员续费模态框
    renewModal() {
        const members = DataManager.getMembers();
        const memberOptions = members.map(m => 
            `<option value="${m.id}">${m.name} - ${m.phone}</option>`
        ).join('');

        return `
            <div class="modal-overlay" id="renewModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">会员续费</h2>
                    </div>
                    <div class="modal-body">
                        <form id="renewForm">
                            <!-- 选择会员 -->
                            <div class="form-group">
                                <label class="form-label">选择会员 *</label>
                                <select id="renewMemberId" class="form-select" required>
                                    <option value="">请选择会员</option>
                                    ${memberOptions}
                                </select>
                            </div>

                            <!-- 续费金额 -->
                            <div class="form-group">
                                <label class="form-label">续费金额 *</label>
                                <input type="number" id="renewAmount" class="form-input" placeholder="请输入续费金额" step="0.01" required>
                            </div>

                            <!-- 续费课时 -->
                            <div class="form-group">
                                <label class="form-label">续费课时 *</label>
                                <input type="number" id="renewCourses" class="form-input" placeholder="请输入续费课时数" required>
                            </div>

                            <!-- 续费日期 -->
                            <div class="form-group">
                                <label class="form-label">续费日期 *</label>
                                <input type="date" id="renewDate" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                        <button type="button" class="btn btn-primary" onclick="submitRenewForm()">确定</button>
                    </div>
                </div>
            </div>
        `;
    },

    // 训练记录模态框
    trainingFormModal(memberId = null) {
        const members = DataManager.getMembers();
        const memberOptions = members.map(m => 
            `<option value="${m.id}" ${memberId === m.id ? 'selected' : ''}>${m.name} - ${m.phone}</option>`
        ).join('');

        return `
            <div class="modal-overlay" id="trainingFormModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h2 class="modal-title">添加训练记录</h2>
                    </div>
                    <div class="modal-body">
                        <form id="trainingForm">
                            <!-- 选择会员 -->
                            <div class="form-group">
                                <label class="form-label">选择会员 *</label>
                                <select id="trainingMemberId" class="form-select" required ${memberId ? 'disabled' : ''}>
                                    <option value="">请选择会员</option>
                                    ${memberOptions}
                                </select>
                            </div>

                            <!-- 训练日期 -->
                            <div class="form-group">
                                <label class="form-label">训练日期 *</label>
                                <input type="date" id="trainingDate" class="form-input" value="${new Date().toISOString().split('T')[0]}" required>
                            </div>

                            <!-- 训练内容 -->
                            <div class="form-group">
                                <label class="form-label">训练内容 *</label>
                                <textarea id="trainingContent" class="form-textarea" placeholder="请输入训练内容详情" required></textarea>
                            </div>

                            <!-- 训练时长 -->
                            <div class="form-group">
                                <label class="form-label">训练时长（分钟）*</label>
                                <input type="number" id="trainingDuration" class="form-input" placeholder="请输入训练时长" value="60" required>
                            </div>

                            <!-- 场地费 -->
                            <div class="form-group">
                                <label class="form-label">场地费</label>
                                <input type="number" id="trainingVenueFee" class="form-input" placeholder="请输入场地费（可选）" step="0.01" value="0">
                            </div>

                            <!-- 备注 -->
                            <div class="form-group">
                                <label class="form-label">备注</label>
                                <textarea id="trainingNote" class="form-textarea" placeholder="请输入备注信息（可选）"></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                        <button type="button" class="btn btn-primary" onclick="submitTrainingForm()">确定</button>
                    </div>
                </div>
            </div>
        `;
    },

    // 确认删除模态框
    confirmDeleteModal(memberName) {
        return `
            <div class="modal-overlay" id="confirmDeleteModal">
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h2 class="modal-title">确认删除</h2>
                    </div>
                    <div class="modal-body">
                        <p style="font-size: 15px; color: var(--color-text-secondary); line-height: 1.8;">
                            确定要删除会员 <strong style="color: var(--color-danger);">${memberName}</strong> 吗？<br>
                            此操作将同时删除该会员的所有训练记录，且无法恢复。
                        </p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                        <button type="button" class="btn btn-delete" id="confirmDeleteBtn">确定删除</button>
                    </div>
                </div>
            </div>
        `;
    }
};

// ==================== 模态框工具函数 ====================

// 显示模态框
function showModal(html) {
    const container = document.getElementById('modalContainer');
    container.innerHTML = html;
    document.body.style.overflow = 'hidden';
}

// 关闭模态框
function closeModal() {
    const container = document.getElementById('modalContainer');
    container.innerHTML = '';
    document.body.style.overflow = '';
}

// 显示Toast提示
function showToast(message, duration = 2000) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, duration);
}

// ==================== 头像上传处理 ====================

// 处理头像选择
document.addEventListener('change', function(e) {
    if (e.target.id === 'avatarInput') {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('avatarPreview').src = event.target.result;
            };
            reader.readAsDataURL(file);
        }
    }
});

// ==================== 表单实时验证 ====================

// 手机号实时验证
document.addEventListener('input', function(e) {
    if (e.target.id === 'memberPhone') {
        const phone = e.target.value.trim();
        const hint = document.getElementById('phoneHint');
        
        if (!phone) {
            hint.style.display = 'none';
            return;
        }
        
        // 验证格式
        if (!DataManager.validatePhone(phone)) {
            hint.textContent = '请输入11位有效的手机号码';
            hint.style.display = 'block';
            hint.style.color = 'var(--color-danger)';
            return;
        }
        
        // 检查重复（需要获取当前编辑的会员ID）
        const form = e.target.closest('form');
        const submitBtn = document.querySelector('.btn-primary[onclick*="submitMemberForm"]');
        let memberId = null;
        if (submitBtn) {
            const match = submitBtn.getAttribute('onclick').match(/submitMemberForm\((\d+|null)\)/);
            if (match && match[1] !== 'null') {
                memberId = parseInt(match[1]);
            }
        }
        
        if (DataManager.isPhoneExists(phone, memberId)) {
            hint.textContent = '该手机号码已被其他会员使用';
            hint.style.display = 'block';
            hint.style.color = 'var(--color-danger)';
        } else {
            hint.textContent = '✓ 手机号可用';
            hint.style.display = 'block';
            hint.style.color = 'var(--color-success)';
        }
    }
});

// 只允许输入数字
document.addEventListener('keypress', function(e) {
    if (e.target.id === 'memberPhone') {
        // 只允许数字
        if (!/\d/.test(e.key)) {
            e.preventDefault();
        }
    }
});
