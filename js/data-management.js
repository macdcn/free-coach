// ==================== 数据管理页面逻辑 ====================

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    updateDataStats();
    initImportFileInput();
});

// 更新数据统计
function updateDataStats() {
    const members = DataManager.getMembers();
    const allTrainings = DataManager.getAllTrainingRecords();
    
    // 计算数据大小（粗略估算）
    const dataStr = localStorage.getItem('fitnessMembers') + localStorage.getItem('trainingRecords');
    const dataSize = new Blob([dataStr || '']).size;
    const dataSizeKB = (dataSize / 1024).toFixed(2);
    
    document.getElementById('totalMembers').textContent = members.length;
    document.getElementById('totalTrainings').textContent = allTrainings.length;
    document.getElementById('dataSize').textContent = `${dataSizeKB} KB`;
}

// 生成模拟数据
function generateMockData() {
    const confirmHtml = `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2 class="modal-title">生成模拟数据</h2>
                </div>
                <div class="modal-body">
                    <p style="font-size: 15px; color: var(--color-text-secondary); line-height: 1.8;">
                        将生成5个模拟会员及若干训练记录。<br>
                        确定要继续吗？
                    </p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button type="button" class="btn btn-primary" onclick="confirmGenerateMockData()">确定</button>
                </div>
            </div>
        </div>
    `;
    showModal(confirmHtml);
}

// 确认生成模拟数据
function confirmGenerateMockData() {
    const mockMembers = [
        {
            name: '张三',
            phone: '13800138001',
            gender: '男',
            totalCourses: 20,
            remainingCourses: 15,
            totalAmount: 2000,
            joinDate: '2025-01-15',
            notes: '模拟数据',
            avatar: ''
        },
        {
            name: '李四',
            phone: '13800138002',
            gender: '女',
            totalCourses: 30,
            remainingCourses: 25,
            totalAmount: 3000,
            joinDate: '2025-02-10',
            notes: '模拟数据',
            avatar: ''
        },
        {
            name: '王五',
            phone: '13800138003',
            gender: '男',
            totalCourses: 15,
            remainingCourses: 10,
            totalAmount: 1500,
            joinDate: '2025-03-05',
            notes: '模拟数据',
            avatar: ''
        },
        {
            name: '赵六',
            phone: '13800138004',
            gender: '女',
            totalCourses: 25,
            remainingCourses: 20,
            totalAmount: 2500,
            joinDate: '2025-04-20',
            notes: '模拟数据',
            avatar: ''
        },
        {
            name: '孙七',
            phone: '13800138005',
            gender: '男',
            totalCourses: 40,
            remainingCourses: 30,
            totalAmount: 4000,
            joinDate: '2025-05-12',
            notes: '模拟数据',
            avatar: ''
        }
    ];

    // 添加模拟会员
    mockMembers.forEach(memberData => {
        DataManager.addMember(memberData);
    });

    // 为每个会员添加一些训练记录
    const members = DataManager.getMembers();
    const bodyParts = TrainingData.getAllBodyParts();
    
    members.forEach(member => {
        // 随机添加3-5条训练记录
        const recordCount = Math.floor(Math.random() * 3) + 3;
        
        for (let i = 0; i < recordCount; i++) {
            const randomBodyPart = bodyParts[Math.floor(Math.random() * bodyParts.length)];
            const actions = TrainingData.getActionsByBodyPart(randomBodyPart);
            
            // 随机选择2-4个动作
            const selectedActions = [];
            const actionCount = Math.min(Math.floor(Math.random() * 3) + 2, actions.length);
            
            for (let j = 0; j < actionCount; j++) {
                const randomAction = actions[Math.floor(Math.random() * actions.length)];
                if (!selectedActions.includes(randomAction)) {
                    selectedActions.push(randomAction);
                }
            }
            
            // 随机生成过去30天内的日期
            const daysAgo = Math.floor(Math.random() * 30);
            const trainingDate = new Date();
            trainingDate.setDate(trainingDate.getDate() - daysAgo);
            
            const trainingData = {
                memberId: member.id,
                memberName: member.name,
                trainingDateTime: trainingDate.toISOString().slice(0, 16),
                bodyPart: randomBodyPart,
                actions: selectedActions,
                notes: '模拟训练记录',
                venueSettled: member.venueMethod === '一次性' ? true : false // 一次性结算自动标记为已结
            };
            
            DataManager.addTrainingRecord(trainingData);
        }
    });

    closeModal();
    showToast('模拟数据生成成功！');
    updateDataStats();
}

// 清空所有数据
function clearAllData() {
    const confirmHtml = `
        <div class="modal-overlay">
            <div class="modal-content" style="max-width: 400px;">
                <div class="modal-header">
                    <h2 class="modal-title">⚠️ 危险操作</h2>
                </div>
                <div class="modal-body">
                    <p style="font-size: 15px; color: var(--color-text-secondary); line-height: 1.8;">
                        确定要清空所有数据吗？<br>
                        <strong style="color: #f44336;">此操作不可恢复！</strong><br><br>
                        将删除所有会员信息和训练记录。
                    </p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                    <button type="button" class="btn btn-delete" onclick="confirmClearAllData()">确定清空</button>
                </div>
            </div>
        </div>
    `;
    showModal(confirmHtml);
}

// 确认清空所有数据
function confirmClearAllData() {
    localStorage.removeItem('fitnessMembers');
    localStorage.removeItem('trainingRecords');
    
    closeModal();
    showToast('所有数据已清空');
    updateDataStats();
}

// 导出数据
function exportData() {
    const members = DataManager.getMembers();
    const trainings = DataManager.getAllTrainingRecords();
    
    const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        members: members,
        trainings: trainings
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `fitness-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    showToast('数据导出成功');
}

// 导入数据
function importData() {
    document.getElementById('importFileInput').click();
}

// 初始化文件输入框事件
function initImportFileInput() {
    const fileInput = document.getElementById('importFileInput');
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const importData = JSON.parse(event.target.result);
                
                // 验证数据格式
                if (!importData.members || !importData.trainings) {
                    showToast('数据格式错误');
                    return;
                }
                
                // 确认导入
                const confirmHtml = `
                    <div class="modal-overlay">
                        <div class="modal-content" style="max-width: 400px;">
                            <div class="modal-header">
                                <h2 class="modal-title">确认导入</h2>
                            </div>
                            <div class="modal-body">
                                <p style="font-size: 15px; color: var(--color-text-secondary); line-height: 1.8;">
                                    将导入：<br>
                                    • ${importData.members.length} 个会员<br>
                                    • ${importData.trainings.length} 条训练记录<br><br>
                                    <strong>注意：导入会覆盖现有数据！</strong>
                                </p>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" onclick="closeModal()">取消</button>
                                <button type="button" class="btn btn-primary" onclick="confirmImportData(${JSON.stringify(importData).replace(/"/g, '&quot;')})">确定导入</button>
                            </div>
                        </div>
                    </div>
                `;
                showModal(confirmHtml);
                
            } catch (error) {
                showToast('文件解析失败');
                console.error(error);
            }
        };
        reader.readAsText(file);
        
        // 清空文件输入框
        fileInput.value = '';
    });
}

// 确认导入数据
function confirmImportData(data) {
    localStorage.setItem('fitnessMembers', JSON.stringify(data.members));
    localStorage.setItem('trainingRecords', JSON.stringify(data.trainings));
    
    closeModal();
    showToast('数据导入成功');
    updateDataStats();
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
    } else {
        // 如果没有容器，创建临时容器
        const tempContainer = document.createElement('div');
        tempContainer.innerHTML = html;
        document.body.appendChild(tempContainer.firstElementChild);
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
    // 兼容处理：如果没有容器，直接移除 modal-overlay
    const overlay = document.querySelector('.modal-overlay');
    if (overlay) {
        overlay.remove();
    }
}

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
    updateDataStats();
    initImportFileInput();
});
