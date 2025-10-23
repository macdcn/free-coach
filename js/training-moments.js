// ==================== 训练精彩瞬间逻辑 ====================

let actionCount = 0;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    loadMembers();
    setDefaultDate();
    addActionItem(); // 默认添加一个动作项
});

// 加载会员列表
function loadMembers() {
    const members = DataManager.getMembers();
    const select = document.getElementById('memberId');
    
    select.innerHTML = '<option value="">请选择会员</option>';
    members.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = `${member.name} - ${member.phone}`;
        option.dataset.avatar = member.avatar || '';
        option.dataset.name = member.name;
        option.dataset.phone = member.phone;
        select.appendChild(option);
    });
}

// 设置默认日期为今天
function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('trainingDate').value = today;
}

// 更新会员信息显示
function updateMemberInfo() {
    const select = document.getElementById('memberId');
    const selectedOption = select.options[select.selectedIndex];
    const display = document.getElementById('memberInfoDisplay');
    
    if (select.value) {
        const avatar = selectedOption.dataset.avatar || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"%3E%3Crect fill="%238B9DC3" width="128" height="128"/%3E%3Cpath fill="%23FFFFFF" d="M64 14c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm0 92c-18.778 0-35.5-9.6-45.25-24.167C28.722 72.5 46.444 66 64 66s35.278 6.5 45.25 15.833C99.5 96.4 82.778 106 64 106z"/%3E%3C/svg%3E';
        
        document.getElementById('displayAvatar').src = avatar;
        document.getElementById('displayName').textContent = selectedOption.dataset.name;
        document.getElementById('displayPhone').textContent = selectedOption.dataset.phone;
        display.style.display = 'block';
    } else {
        display.style.display = 'none';
    }
}

// 添加动作项
function addActionItem() {
    actionCount++;
    const container = document.getElementById('actionsContainer');
    
    // 获取基础信息中选择的训练部位
    const mainBodyPart = document.getElementById('bodyPart').value;
    
    const actionItem = document.createElement('div');
    actionItem.className = 'action-item';
    actionItem.id = `action-${actionCount}`;
    actionItem.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="font-size: 15px; font-weight: 600; color: var(--color-text-primary);">动作 ${actionCount}</h3>
            <button type="button" onclick="removeActionItem(${actionCount})" class="btn-icon-delete">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                </svg>
            </button>
        </div>
        
        <div class="form-group">
            <label class="form-label">动作名称 *</label>
            <select class="form-input action-name" required ${mainBodyPart ? '' : 'disabled'}>
                ${mainBodyPart ? getActionOptions(mainBodyPart) : '<option value="">请先在基础信息中选择训练部位</option>'}
            </select>
        </div>
        
        <div class="form-group">
            <label class="form-label">组数 × 次数</label>
            <div style="display: flex; gap: 8px;">
                <input type="number" class="form-input action-sets" placeholder="组数" style="flex: 1;" min="1">
                <span style="display: flex; align-items: center; color: var(--color-text-secondary);">×</span>
                <input type="number" class="form-input action-reps" placeholder="次数" style="flex: 1;" min="1">
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">动作照片</label>
            <div class="photo-upload-container">
                <input type="file" id="photo-${actionCount}" class="photo-input" accept="image/*" onchange="handlePhotoUpload(${actionCount}, event)">
                <label for="photo-${actionCount}" class="photo-upload-label">
                    <div class="photo-preview" id="preview-${actionCount}">
                        <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                        </svg>
                        <span style="margin-top: 8px; font-size: 14px;">点击上传照片</span>
                    </div>
                </label>
            </div>
        </div>
        
        <div class="form-group">
            <label class="form-label">动作说明</label>
            <textarea class="form-textarea action-notes" placeholder="例如：注意肩胛骨收紧..." rows="2"></textarea>
        </div>
    `;
    
    container.appendChild(actionItem);
}

// 获取动作选项HTML
function getActionOptions(bodyPart) {
    const actions = TrainingData.getActionsByBodyPart(bodyPart);
    let html = '<option value="">请选择动作</option>';
    actions.forEach(action => {
        html += `<option value="${action}">${action}</option>`;
    });
    return html;
}

// 当基础信息中的训练部位改变时，更新所有动作的选项
function updateMainBodyPartActions() {
    const mainBodyPart = document.getElementById('bodyPart').value;
    const actionSelects = document.querySelectorAll('.action-name');
    
    actionSelects.forEach(select => {
        if (mainBodyPart) {
            select.disabled = false;
            select.innerHTML = getActionOptions(mainBodyPart);
        } else {
            select.disabled = true;
            select.innerHTML = '<option value="">请先在基础信息中选择训练部位</option>';
        }
    });
}

// 移除动作项
function removeActionItem(id) {
    const actionItems = document.querySelectorAll('.action-item');
    if (actionItems.length <= 1) {
        showToast('至少保留一个动作');
        return;
    }
    
    const item = document.getElementById(`action-${id}`);
    if (item) {
        item.remove();
        // 重新编号
        renumberActions();
    }
}

// 重新编号动作
function renumberActions() {
    const actionItems = document.querySelectorAll('.action-item');
    actionItems.forEach((item, index) => {
        const title = item.querySelector('h3');
        if (title) {
            title.textContent = `动作 ${index + 1}`;
        }
    });
}

// 处理照片上传
function handlePhotoUpload(id, event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // 检查文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
        showToast('照片大小不能超过5MB');
        event.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById(`preview-${id}`);
        preview.innerHTML = `<img src="${e.target.result}" alt="动作照片" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px;">`;
        preview.dataset.photo = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 收集表单数据
function collectFormData() {
    const memberId = document.getElementById('memberId').value;
    const trainingDate = document.getElementById('trainingDate').value;
    const bodyPart = document.getElementById('bodyPart').value;
    const duration = document.getElementById('duration').value;
    const calories = document.getElementById('calories').value;
    const coachComment = document.getElementById('coachComment').value;
    
    // 验证基础信息
    if (!memberId || !trainingDate || !bodyPart || !duration || !calories) {
        showToast('请填写完整的基础信息');
        return null;
    }
    
    // 收集动作信息
    const actions = [];
    const actionItems = document.querySelectorAll('.action-item');
    
    for (let item of actionItems) {
        const name = item.querySelector('.action-name').value;
        const sets = item.querySelector('.action-sets').value;
        const reps = item.querySelector('.action-reps').value;
        const notes = item.querySelector('.action-notes').value;
        const preview = item.querySelector('.photo-preview');
        const photo = preview.dataset.photo || '';
        
        if (!name) {
            showToast('请选择所有动作的名称');
            return null;
        }
        
        actions.push({
            bodyPart, // 使用基础信息中的部位
            name,
            sets: sets || '',
            reps: reps || '',
            notes,
            photo
        });
    }
    
    if (actions.length === 0) {
        showToast('请至少添加一个动作');
        return null;
    }
    
    // 获取会员信息
    const member = DataManager.getMemberById(parseInt(memberId));
    
    return {
        member,
        trainingDate,
        bodyPart,
        duration,
        calories,
        coachComment,
        actions,
        createdAt: new Date().toISOString()
    };
}

// 预览
function previewMoment() {
    const data = collectFormData();
    if (!data) return;
    
    // 生成预览页面
    const html = generateMomentHTML(data, true);
    
    // 在新窗口中显示预览
    const previewWindow = window.open('', '_blank');
    previewWindow.document.write(html);
    previewWindow.document.close();
}

// 生成并保存
function generateMoment() {
    const data = collectFormData();
    if (!data) return;
    
    // 确认对话框
    const confirmHtml = `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2 class="modal-title">生成训练瞬间</h2>
                </div>
                <div class="modal-body">
                    <p style="font-size: 15px; color: var(--color-text-secondary); line-height: 1.8;">
                        将为 <strong>${data.member.name}</strong> 生成训练精彩瞬间分享页面。<br><br>
                        是否继续？
                    </p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="confirmGenerateMoment()">确定生成</button>
                </div>
            </div>
        </div>
    `;
    showModal(confirmHtml);
    
    // 临时保存数据
    window.tempMomentData = data;
}

// 确认生成
function confirmGenerateMoment() {
    const data = window.tempMomentData;
    if (!data) return;
    
    closeModal();
    
    // 生成HTML
    const html = generateMomentHTML(data, false);
    
    // 保存到localStorage（可选）
    saveMomentToStorage(data);
    
    // 下载HTML文件
    downloadHTML(html, data);
    
    showToast('✨ 生成成功！');
    
    // 清空表单
    setTimeout(() => {
        if (confirm('是否清空表单继续创建下一个？')) {
            location.reload();
        }
    }, 1500);
}

// 生成HTML内容
function generateMomentHTML(data, isPreview) {
    const { member, trainingDate, bodyPart, duration, calories, coachComment, actions } = data;
    
    // 格式化日期
    const dateObj = new Date(trainingDate);
    const dateStr = dateObj.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
    const weekDay = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][dateObj.getDay()];
    
    // 获取部位颜色
    const bodyPartColor = TrainingData.getBodyPartColor(bodyPart);
    
    // 生成动作列表HTML
    const actionsHTML = actions.map((action, index) => `
        <div class="moment-action-item">
            ${action.photo ? `
                <div class="moment-photo">
                    <img src="${action.photo}" alt="${action.name}">
                </div>
            ` : ''}
            <div class="moment-action-info">
                <div class="moment-action-header">
                    <span class="moment-action-number">${index + 1}</span>
                    <h3 class="moment-action-name">${action.name}</h3>
                </div>
                ${action.sets && action.reps ? `
                    <div class="moment-action-sets">
                        <span class="sets-badge">${action.sets} 组 × ${action.reps} 次</span>
                    </div>
                ` : ''}
                ${action.notes ? `
                    <p class="moment-action-notes">${action.notes}</p>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${member.name}的训练精彩瞬间 - ${dateStr}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background: linear-gradient(135deg, #F8F6F3 0%, #E8DCC4 100%);
            padding: 20px;
            min-height: 100vh;
        }
        
        .moment-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 20px 60px rgba(139, 157, 195, 0.3);
        }
        
        .moment-header {
            background: linear-gradient(135deg, #8B9DC3, #A8B8D8);
            padding: 40px 30px;
            color: white;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        .moment-header::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 15s infinite;
        }
        
        @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            50% { transform: translate(20px, 20px) rotate(180deg); }
        }
        
        .moment-avatar {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            border: 4px solid white;
            margin: 0 auto 20px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
            position: relative;
            z-index: 1;
        }
        
        .moment-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            border-radius: 50%;
        }
        
        .moment-title {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
        }
        
        .moment-subtitle {
            font-size: 16px;
            opacity: 0.95;
            position: relative;
            z-index: 1;
        }
        
        .moment-date {
            margin-top: 16px;
            font-size: 15px;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }
        
        .moment-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            padding: 30px;
            background: linear-gradient(135deg, #F8F6F3, white);
        }
        
        .stat-item {
            text-align: center;
            padding: 20px;
            background: white;
            border-radius: 16px;
            box-shadow: 0 4px 12px rgba(139, 157, 195, 0.1);
        }
        
        .stat-icon {
            font-size: 32px;
            margin-bottom: 8px;
        }
        
        .stat-value {
            font-size: 24px;
            font-weight: 700;
            color: #8B9DC3;
            margin-bottom: 4px;
            word-break: keep-all;
            overflow-wrap: break-word;
        }
        
        .stat-label {
            font-size: 13px;
            color: #7A7A7A;
        }
        
        .moment-content {
            padding: 30px;
        }
        
        .moment-section-title {
            font-size: 20px;
            font-weight: 700;
            color: #4A4A4A;
            margin-bottom: 20px;
            padding-bottom: 12px;
            border-bottom: 3px solid #8B9DC3;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .moment-actions {
            display: grid;
            gap: 24px;
        }
        
        .moment-action-item {
            background: linear-gradient(135deg, #FFFFFF, #F8F6F3);
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(139, 157, 195, 0.08);
            transition: transform 0.3s;
        }
        
        .moment-action-item:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(139, 157, 195, 0.15);
        }
        
        .moment-photo {
            width: 100%;
            height: 300px;
            overflow: hidden;
            background: #E8DCC4;
        }
        
        .moment-photo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .moment-action-info {
            padding: 20px;
        }
        
        .moment-action-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
        }
        
        .moment-action-number {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #8B9DC3, #A8B8D8);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            flex-shrink: 0;
        }
        
        .moment-action-name {
            font-size: 18px;
            font-weight: 600;
            color: #4A4A4A;
        }
        
        .moment-action-sets {
            margin-bottom: 12px;
        }
        
        .sets-badge {
            display: inline-block;
            padding: 6px 14px;
            background: linear-gradient(135deg, #A8C5A8, #B8D5B8);
            color: white;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 600;
        }
        
        .moment-action-notes {
            font-size: 14px;
            color: #7A7A7A;
            line-height: 1.6;
            padding: 12px;
            background: white;
            border-left: 3px solid #8B9DC3;
            border-radius: 8px;
        }
        
        .moment-comment {
            margin-top: 30px;
            padding: 24px;
            background: linear-gradient(135deg, #FFF9F0, #F8F6F3);
            border-radius: 16px;
            border: 2px solid #E8DCC4;
        }
        
        .comment-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 12px;
        }
        
        .comment-icon {
            font-size: 24px;
        }
        
        .comment-title {
            font-size: 16px;
            font-weight: 700;
            color: #8B9DC3;
        }
        
        .comment-content {
            font-size: 15px;
            color: #4A4A4A;
            line-height: 1.8;
            white-space: pre-wrap;
        }
        
        .moment-footer {
            padding: 30px;
            background: linear-gradient(135deg, #8B9DC3, #A8B8D8);
            color: white;
            text-align: center;
        }
        
        .footer-text {
            font-size: 14px;
            opacity: 0.95;
            margin-bottom: 8px;
        }
        
        .footer-logo {
            font-size: 18px;
            font-weight: 700;
            letter-spacing: 1px;
        }
        
        ${isPreview ? `
        .preview-badge {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: rgba(255, 152, 0, 0.95);
            color: white;
            border-radius: 30px;
            font-weight: 600;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(255, 152, 0, 0.4);
            z-index: 1000;
        }
        ` : ''}
        
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            
            .moment-header {
                padding: 30px 20px;
            }
            
            .moment-title {
                font-size: 24px;
            }
            
            .moment-stats {
                grid-template-columns: 1fr;
                gap: 12px;
                padding: 20px;
            }
            
            .stat-value {
                font-size: 20px;
            }
            
            .moment-content {
                padding: 20px;
            }
            
            .moment-photo {
                height: 200px;
            }
        }
    </style>
</head>
<body>
    ${isPreview ? '<div class="preview-badge">👁️ 预览模式</div>' : ''}
    
    <div class="moment-container">
        <!-- 头部 -->
        <div class="moment-header">
            <div class="moment-avatar">
                <img src="${member.avatar || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"%3E%3Crect fill="%23FFFFFF" width="128" height="128"/%3E%3Cpath fill="%238B9DC3" d="M64 14c-13.255 0-24 10.745-24 24s10.745 24 24 24 24-10.745 24-24-10.745-24-24-24zm0 92c-18.778 0-35.5-9.6-45.25-24.167C28.722 72.5 46.444 66 64 66s35.278 6.5 45.25 15.833C99.5 96.4 82.778 106 64 106z"/%3E%3C/svg%3E'}" alt="${member.name}">
            </div>
            <h1 class="moment-title">💪 训练精彩瞬间</h1>
            <p class="moment-subtitle">${member.name} 的专属训练记录</p>
            <p class="moment-date">📅 ${dateStr} ${weekDay}</p>
        </div>
        
        <!-- 训练数据 -->
        <div class="moment-stats">
            <div class="stat-item">
                <div class="stat-icon">🎯</div>
                <div class="stat-value">${bodyPart}</div>
                <div class="stat-label">训练部位</div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">⏱️</div>
                <div class="stat-value">${duration}</div>
                <div class="stat-label">分钟</div>
            </div>
            <div class="stat-item">
                <div class="stat-icon">🔥</div>
                <div class="stat-value">${calories}</div>
                <div class="stat-label">千卡</div>
            </div>
        </div>
        
        <!-- 训练内容 -->
        <div class="moment-content">
            <h2 class="moment-section-title">
                <span>🏋️</span>
                <span>训练动作</span>
            </h2>
            <div class="moment-actions">
                ${actionsHTML}
            </div>
            
            ${coachComment ? `
            <div class="moment-comment">
                <div class="comment-header">
                    <span class="comment-icon">💬</span>
                    <span class="comment-title">教练点评</span>
                </div>
                <p class="comment-content">${coachComment}</p>
            </div>
            ` : ''}
        </div>
        
        <!-- 底部 -->
        <div class="moment-footer">
            <p class="footer-text">Keep Going, Keep Growing</p>
            <p class="footer-logo">✨ 健身教练会员管理系统 ✨</p>
        </div>
    </div>
</body>
</html>`;
}

// 保存到localStorage
function saveMomentToStorage(data) {
    const moments = JSON.parse(localStorage.getItem('trainingMoments') || '[]');
    moments.push({
        id: Date.now(),
        memberId: data.member.id,
        memberName: data.member.name,
        trainingDate: data.trainingDate,
        bodyPart: data.bodyPart,
        createdAt: data.createdAt
    });
    localStorage.setItem('trainingMoments', JSON.stringify(moments));
}

// 下载HTML文件
function downloadHTML(html, data) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `训练瞬间-${data.member.name}-${data.trainingDate}.html`;
    a.click();
    URL.revokeObjectURL(url);
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
    const container = document.getElementById('modalContainer');
    if (container) {
        container.innerHTML = html;
    }
    
    // 添加点击遮罩关闭功能
    setTimeout(() => {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) {
            overlay.addEventListener('click', function(e) {
                if (e.target === overlay) {
                    closeModal();
                }
            });
        }
    }, 100);
}

// 关闭模态框
function closeModal() {
    const container = document.getElementById('modalContainer');
    if (container) {
        container.innerHTML = '';
    }
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.remove();
    }
}
