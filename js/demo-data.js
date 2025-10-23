// ==================== 演示数据生成器 ====================

function initDemoData() {
    // 检查是否已有数据
    const existingMembers = DataManager.getMembers();
    if (existingMembers.length > 0) {
        console.log('已有会员数据，跳过演示数据初始化');
        return;
    }

    // 创建演示会员数据
    const demoMembers = [
        {
            name: '张三',
            phone: '13800138001',
            gender: '男',
            type: '包月',
            amount: 3000,
            courses: 12,
            paymentDate: '2025-10-01',
            venueMethod: '一次性',
            note: '目标：减重10kg',
            avatar: ''
        },
        {
            name: '李四',
            phone: '13800138002',
            gender: '女',
            type: '按次',
            amount: 2000,
            courses: 8,
            paymentDate: '2025-10-15',
            venueMethod: '10次一结',
            note: '注意：膝盖有旧伤',
            avatar: ''
        },
        {
            name: '王五',
            phone: '13800138003',
            gender: '男',
            type: '按次',
            amount: 1500,
            courses: 2,
            paymentDate: '2025-10-10',
            venueMethod: '10次一结',
            note: '增肌训练计划',
            avatar: ''
        }
    ];

    // 添加演示会员
    demoMembers.forEach(memberData => {
        DataManager.addMember(memberData);
    });

    console.log('演示数据初始化完成');
}

// 页面加载时初始化演示数据
// 如果不需要演示数据，可以注释掉下面这行
// document.addEventListener('DOMContentLoaded', initDemoData);
