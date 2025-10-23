// ==================== 数据管理模块 ====================

// 本地存储键名
const STORAGE_KEYS = {
    MEMBERS: 'fitnessMembers',
    TRAINING_RECORDS: 'trainingRecords',
    NEXT_MEMBER_ID: 'next_member_id',
    NEXT_RECORD_ID: 'next_record_id'
};

// 数据存储管理器
const DataManager = {
    // 获取所有会员
    getMembers() {
        const data = localStorage.getItem(STORAGE_KEYS.MEMBERS);
        return data ? JSON.parse(data) : [];
    },

    // 保存所有会员
    saveMembers(members) {
        localStorage.setItem(STORAGE_KEYS.MEMBERS, JSON.stringify(members));
    },

    // 获取单个会员
    getMemberById(id) {
        const members = this.getMembers();
        return members.find(m => m.id === id);
    },

    // 添加会员
    addMember(memberData) {
        const members = this.getMembers();
        const nextId = this.getNextMemberId();
        
        const newMember = {
            id: nextId,
            ...memberData,
            createdAt: new Date().toISOString(),
            renewCount: 0, // 续费次数
            totalCourses: memberData.courses, // 总课时
            remainingCourses: memberData.courses, // 剩余课时
            totalAmount: memberData.amount, // 总金额
            remainingAmount: memberData.amount, // 剩余金额
            venueSettledTimes: 0 // 已结算场地费次数
        };

        members.push(newMember);
        this.saveMembers(members);
        this.incrementMemberId();
        
        return newMember;
    },

    // 更新会员
    updateMember(id, updates) {
        const members = this.getMembers();
        const index = members.findIndex(m => m.id === id);
        
        if (index !== -1) {
            members[index] = { ...members[index], ...updates };
            this.saveMembers(members);
            return members[index];
        }
        return null;
    },

    // 删除会员
    deleteMember(id) {
        const members = this.getMembers();
        const filtered = members.filter(m => m.id !== id);
        this.saveMembers(filtered);
        
        // 同时删除该会员的训练记录
        const records = this.getTrainingRecords();
        const filteredRecords = records.filter(r => r.memberId !== id);
        this.saveTrainingRecords(filteredRecords);
    },

    // 会员续费
    renewMember(id, renewData) {
        const member = this.getMemberById(id);
        if (!member) return null;

        const updates = {
            remainingAmount: member.remainingAmount + parseFloat(renewData.amount),
            remainingCourses: member.remainingCourses + parseInt(renewData.courses),
            totalCourses: member.totalCourses + parseInt(renewData.courses),
            totalAmount: member.totalAmount + parseFloat(renewData.amount),
            renewCount: member.renewCount + 1,
            lastRenewDate: renewData.renewDate
        };

        return this.updateMember(id, updates);
    },

    // 获取下一个会员ID
    getNextMemberId() {
        const id = localStorage.getItem(STORAGE_KEYS.NEXT_MEMBER_ID);
        return id ? parseInt(id) : 1;
    },

    // 递增会员ID
    incrementMemberId() {
        const nextId = this.getNextMemberId() + 1;
        localStorage.setItem(STORAGE_KEYS.NEXT_MEMBER_ID, nextId.toString());
    },

    // ==================== 训练记录相关 ====================

    // 获取所有训练记录
    getTrainingRecords() {
        const data = localStorage.getItem(STORAGE_KEYS.TRAINING_RECORDS);
        return data ? JSON.parse(data) : [];
    },

    // 获取所有训练记录（别名）
    getAllTrainingRecords() {
        return this.getTrainingRecords();
    },

    // 保存所有训练记录
    saveTrainingRecords(records) {
        localStorage.setItem(STORAGE_KEYS.TRAINING_RECORDS, JSON.stringify(records));
    },

    // 获取会员的训练记录
    getMemberTrainingRecords(memberId) {
        const records = this.getTrainingRecords();
        return records.filter(r => r.memberId === memberId);
    },

    // 添加训练记录
    addTrainingRecord(recordData) {
        const records = this.getTrainingRecords();
        const nextId = this.getNextRecordId();

        const newRecord = {
            id: nextId,
            ...recordData,
            createdAt: new Date().toISOString()
        };

        records.push(newRecord);
        this.saveTrainingRecords(records);
        this.incrementRecordId();

        // 更新会员课时和场地费结算状态（仅正常训练时扣除课时）
        const isLeave = recordData.recordType === 'leave' || recordData.bodyPart === '请假有事';
        this.updateMemberAfterTraining(recordData.memberId, recordData.venueFee, isLeave);

        return newRecord;
    },

    // 训练后更新会员信息
    updateMemberAfterTraining(memberId, venueFee = 0, isLeave = false) {
        const member = this.getMemberById(memberId);
        if (!member) return;

        const updates = {};
        
        // 只有正常训练才扣除课时
        if (!isLeave) {
            updates.remainingCourses = member.remainingCourses - 1;
        }

        // 如果是10次结算方式，更新已结算次数
        if (member.venueMethod === '10次一结' && venueFee > 0) {
            updates.venueSettledTimes = (member.venueSettledTimes || 0) + 1;
        }

        // 只有当有更新内容时才调用更新方法
        if (Object.keys(updates).length > 0) {
            this.updateMember(memberId, updates);
        }
    },

    // 删除训练记录
    deleteTrainingRecord(id) {
        const records = this.getTrainingRecords();
        const filtered = records.filter(r => r.id !== id);
        this.saveTrainingRecords(filtered);
    },

    // 更新训练记录
    updateTrainingRecord(id, updates) {
        const records = this.getTrainingRecords();
        const index = records.findIndex(r => r.id === id);
        
        if (index !== -1) {
            records[index] = { ...records[index], ...updates };
            this.saveTrainingRecords(records);
            return records[index];
        }
        return null;
    },

    // 获取下一个记录ID
    getNextRecordId() {
        const id = localStorage.getItem(STORAGE_KEYS.NEXT_RECORD_ID);
        return id ? parseInt(id) : 1;
    },

    // 递增记录ID
    incrementRecordId() {
        const nextId = this.getNextRecordId() + 1;
        localStorage.setItem(STORAGE_KEYS.NEXT_RECORD_ID, nextId.toString());
    },

    // ==================== 工具方法 ====================

    // 检查电话号码是否存在
    isPhoneExists(phone, excludeMemberId = null) {
        const members = this.getMembers();
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
            return 'expired'; // 已过期
        } else if (remaining <= 3) {
            return 'warning'; // 警告
        } else {
            return 'active'; // 活跃
        }
    },

    // 计算场地费结算状态
    getVenueStatus(member) {
        const trainings = this.getMemberTrainingRecords(member.id);
        
        if (trainings.length === 0) {
            return 'unsettled'; // 无训练记录
        }
        
        const unsettled = trainings.filter(t => !t.venueSettled).length;
        const settled = trainings.filter(t => t.venueSettled).length;
        
        if (member.venueMethod === '一次性') {
            // 一次性结算：全部结清或全部未结
            return unsettled === 0 ? 'settled' : 'unsettled';
        }
        
        // 10次一结
        if (unsettled === 0 && settled > 0) {
            return 'settled'; // 全部结清
        } else if (settled > 0 && unsettled > 0) {
            return 'partial'; // 部分结算
        } else {
            return 'unsettled'; // 未结算
        }
    },

    // 格式化日期
    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN');
    },

    // 清空所有数据（开发测试用）
    clearAllData() {
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
        });
    }
};
