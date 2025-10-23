// ==================== 云端数据管理模块 ====================
// 使用 Netlify Blobs API 存储数据（支持多用户）

// API基础URL
const API_BASE = window.location.hostname === 'localhost' 
  ? 'http://localhost:8888/.netlify/functions' 
  : '/.netlify/functions';

// 获取当前登录用户
function getCurrentUser() {
    const userStr = sessionStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

// 获取用户名参数
function getUserParam() {
    const user = getCurrentUser();
    return user ? `?username=${encodeURIComponent(user.username)}` : '';
}

// 数据存储管理器（云端版本）
const DataManager = {
    // ==================== 会员相关 ====================
    
    // 获取所有会员
    async getMembers() {
        try {
            const response = await fetch(`${API_BASE}/members-api${getUserParam()}`);
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            console.error('获取会员失败:', result.error);
            return [];
        } catch (error) {
            console.error('获取会员错误:', error);
            // 如果API调用失败，尝试从localStorage读取
            return this.getLocalMembers();
        }
    },

    // 获取单个会员
    async getMemberById(id) {
        try {
            const response = await fetch(`${API_BASE}/members-api/${id}${getUserParam()}`);
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            return null;
        } catch (error) {
            console.error('获取会员错误:', error);
            const members = await this.getLocalMembers();
            return members.find(m => m.id === id);
        }
    },

    // 添加会员
    async addMember(memberData) {
        try {
            const response = await fetch(`${API_BASE}/members-api${getUserParam()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(memberData)
            });
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            console.error('添加会员失败:', result.error);
            return null;
        } catch (error) {
            console.error('添加会员错误:', error);
            return null;
        }
    },

    // 更新会员
    async updateMember(id, updates) {
        try {
            const response = await fetch(`${API_BASE}/members-api/${id}${getUserParam()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            console.error('更新会员失败:', result.error);
            return null;
        } catch (error) {
            console.error('更新会员错误:', error);
            return null;
        }
    },

    // 删除会员
    async deleteMember(id) {
        try {
            const response = await fetch(`${API_BASE}/members-api/${id}${getUserParam()}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('删除会员错误:', error);
            return false;
        }
    },

    // 会员续费
    async renewMember(id, renewData) {
        const member = await this.getMemberById(id);
        if (!member) return null;

        const updates = {
            remainingAmount: member.remainingAmount + parseFloat(renewData.amount),
            remainingCourses: member.remainingCourses + parseInt(renewData.courses),
            totalCourses: member.totalCourses + parseInt(renewData.courses),
            totalAmount: member.totalAmount + parseFloat(renewData.amount),
            renewCount: member.renewCount + 1,
            lastRenewDate: renewData.renewDate
        };

        return await this.updateMember(id, updates);
    },

    // ==================== 训练记录相关 ====================

    // 获取所有训练记录
    async getTrainingRecords() {
        try {
            const response = await fetch(`${API_BASE}/trainings-api${getUserParam()}`);
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            console.error('获取训练记录失败:', result.error);
            return [];
        } catch (error) {
            console.error('获取训练记录错误:', error);
            return this.getLocalTrainings();
        }
    },

    // 获取所有训练记录（别名）
    async getAllTrainingRecords() {
        return await this.getTrainingRecords();
    },

    // 获取会员的训练记录
    async getMemberTrainingRecords(memberId) {
        try {
            const userParam = getUserParam();
            const separator = userParam ? '&' : '?';
            const response = await fetch(`${API_BASE}/trainings-api${userParam}${separator}memberId=${memberId}`);
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            return [];
        } catch (error) {
            console.error('获取会员训练记录错误:', error);
            const records = await this.getLocalTrainings();
            return records.filter(r => r.memberId === memberId);
        }
    },

    // 添加训练记录
    async addTrainingRecord(recordData) {
        try {
            const response = await fetch(`${API_BASE}/trainings-api${getUserParam()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(recordData)
            });
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            console.error('添加训练记录失败:', result.error);
            return null;
        } catch (error) {
            console.error('添加训练记录错误:', error);
            return null;
        }
    },

    // 更新训练记录
    async updateTrainingRecord(id, updates) {
        try {
            const response = await fetch(`${API_BASE}/trainings-api/${id}${getUserParam()}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            });
            const result = await response.json();
            if (result.success) {
                return result.data;
            }
            return null;
        } catch (error) {
            console.error('更新训练记录错误:', error);
            return null;
        }
    },

    // 删除训练记录
    async deleteTrainingRecord(id) {
        try {
            const response = await fetch(`${API_BASE}/trainings-api/${id}${getUserParam()}`, {
                method: 'DELETE'
            });
            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('删除训练记录错误:', error);
            return false;
        }
    },

    // ==================== 数据迁移 ====================

    // 从localStorage迁移到云端
    async migrateFromLocal() {
        const members = this.getLocalMembers();
        const trainings = this.getLocalTrainings();

        if (members.length === 0 && trainings.length === 0) {
            return { success: true, message: '没有需要迁移的数据' };
        }

        try {
            const response = await fetch(`${API_BASE}/migrate-data${getUserParam()}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ members, trainings })
            });
            const result = await response.json();
            
            if (result.success) {
                // 迁移成功后，清除localStorage数据（可选）
                // localStorage.removeItem('fitnessMembers');
                // localStorage.removeItem('trainingRecords');
                console.log('数据迁移成功:', result.stats);
            }
            
            return result;
        } catch (error) {
            console.error('数据迁移错误:', error);
            return { success: false, error: error.message };
        }
    },

    // ==================== 本地存储辅助方法（用于降级） ====================

    getLocalMembers() {
        const data = localStorage.getItem('fitnessMembers');
        return data ? JSON.parse(data) : [];
    },

    getLocalTrainings() {
        const data = localStorage.getItem('trainingRecords');
        return data ? JSON.parse(data) : [];
    },

    // ==================== 工具方法 ====================

    // 检查电话号码是否存在
    async isPhoneExists(phone, excludeMemberId = null) {
        const members = await this.getMembers();
        return members.some(m => {
            if (excludeMemberId && m.id === excludeMemberId) {
                return false;
            }
            return m.phone === phone;
        });
    },

    // 验证手机号格式
    validatePhone(phone) {
        const phoneRegex = /^1[3-9]\d{9}$/;
        return phoneRegex.test(phone);
    },

    // 计算会员状态
    getMemberStatus(member) {
        const remaining = member.remainingCourses;
        
        if (remaining <= 0) {
            return 'expired';
        } else if (remaining <= 3) {
            return 'warning';
        } else {
            return 'active';
        }
    },

    // 计算场地费结算状态
    async getVenueStatus(member) {
        const trainings = await this.getMemberTrainingRecords(member.id);
        
        if (trainings.length === 0) {
            return 'unsettled';
        }
        
        const unsettled = trainings.filter(t => !t.venueSettled).length;
        const settled = trainings.filter(t => t.venueSettled).length;
        
        if (member.venueMethod === '一次性') {
            return unsettled === 0 ? 'settled' : 'unsettled';
        }
        
        if (unsettled === 0 && settled > 0) {
            return 'settled';
        } else if (settled > 0 && unsettled > 0) {
            return 'partial';
        } else {
            return 'unsettled';
        }
    },

    // 格式化日期
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    }
};

// 兼容旧代码的STORAGE_KEYS
const STORAGE_KEYS = {
    MEMBERS: 'fitnessMembers',
    TRAINING_RECORDS: 'trainingRecords',
    NEXT_MEMBER_ID: 'next_member_id',
    NEXT_RECORD_ID: 'next_record_id'
};
