// ==================== 训练记录API - Netlify Functions ====================
// 使用Netlify Blobs存储训练记录

import { getStore } from '@netlify/blobs';

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

export default async (req, context) => {
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    // 获取用户信息
    const url = new URL(req.url);
    const username = url.searchParams.get('username') || req.headers.get('X-Username');
    
    if (!username) {
      return new Response(JSON.stringify({ success: false, error: '未登录或缺少用户信息' }), {
        status: 401,
        headers
      });
    }

    // 获取 Blobs store
    const store = getStore('fitness-data');
    
    // 使用用户名作为键的前缀
    const trainingsKey = `${username}_trainings`;
    const membersKey = `${username}_members`;
    
    // 解析请求
    const searchParams = url.searchParams;
    const path = url.pathname.replace('/api/trainings', '');
    const method = req.method;

    // GET /api/trainings - 获取所有训练记录或按会员ID筛选
    if (method === 'GET' && !path) {
      const trainingsData = await store.get(trainingsKey, { type: 'json' });
      let trainings = trainingsData || [];
      
      // 如果有memberId参数，筛选该会员的记录
      const memberId = searchParams.get('memberId');
      if (memberId) {
        trainings = trainings.filter(t => t.memberId === parseInt(memberId));
      }
      
      return new Response(JSON.stringify({ success: true, data: trainings }), {
        status: 200,
        headers
      });
    }

    // GET /api/trainings/:id - 获取单条训练记录
    if (method === 'GET' && path) {
      const id = parseInt(path.substring(1));
      const trainingsData = await store.get(trainingsKey, { type: 'json' });
      const trainings = trainingsData || [];
      const training = trainings.find(t => t.id === id);
      
      if (!training) {
        return new Response(JSON.stringify({ success: false, error: '训练记录不存在' }), {
          status: 404,
          headers
        });
      }
      
      return new Response(JSON.stringify({ success: true, data: training }), {
        status: 200,
        headers
      });
    }

    // POST /api/trainings - 添加训练记录
    if (method === 'POST') {
      const body = await req.json();
      const trainingsData = await store.get(trainingsKey, { type: 'json' });
      const trainings = trainingsData || [];
      
      // 获取下一个ID
      const nextId = trainings.length > 0 ? Math.max(...trainings.map(t => t.id)) + 1 : 1;
      
      const newTraining = {
        id: nextId,
        ...body,
        createdAt: new Date().toISOString()
      };
      
      trainings.push(newTraining);
      await store.setJSON(trainingsKey, trainings);
      
      // 更新会员课时（如果不是请假记录）
      const isLeave = body.recordType === 'leave' || body.bodyPart === '请假有事';
      if (!isLeave && body.memberId) {
        const membersData = await store.get(membersKey, { type: 'json' });
        const members = membersData || [];
        const memberIndex = members.findIndex(m => m.id === body.memberId);
        
        if (memberIndex !== -1) {
          members[memberIndex].remainingCourses -= 1;
          
          // 更新场地费结算次数
          if (members[memberIndex].venueMethod === '10次一结' && body.venueFee > 0) {
            members[memberIndex].venueSettledTimes = (members[memberIndex].venueSettledTimes || 0) + 1;
          }
          
          await store.setJSON(membersKey, members);
        }
      }
      
      return new Response(JSON.stringify({ success: true, data: newTraining }), {
        status: 201,
        headers
      });
    }

    // PUT /api/trainings/:id - 更新训练记录
    if (method === 'PUT' && path) {
      const id = parseInt(path.substring(1));
      const body = await req.json();
      const trainingsData = await store.get(trainingsKey, { type: 'json' });
      const trainings = trainingsData || [];
      const index = trainings.findIndex(t => t.id === id);
      
      if (index === -1) {
        return new Response(JSON.stringify({ success: false, error: '训练记录不存在' }), {
          status: 404,
          headers
        });
      }
      
      trainings[index] = { ...trainings[index], ...body };
      await store.setJSON(trainingsKey, trainings);
      
      return new Response(JSON.stringify({ success: true, data: trainings[index] }), {
        status: 200,
        headers
      });
    }

    // DELETE /api/trainings/:id - 删除训练记录
    if (method === 'DELETE' && path) {
      const id = parseInt(path.substring(1));
      const trainingsData = await store.get(trainingsKey, { type: 'json' });
      const trainings = trainingsData || [];
      const filtered = trainings.filter(t => t.id !== id);
      
      if (filtered.length === trainings.length) {
        return new Response(JSON.stringify({ success: false, error: '训练记录不存在' }), {
          status: 404,
          headers
        });
      }
      
      await store.setJSON(trainingsKey, filtered);
      
      return new Response(JSON.stringify({ success: true, message: '删除成功' }), {
        status: 200,
        headers
      });
    }

    // 不支持的方法
    return new Response(JSON.stringify({ success: false, error: '不支持的请求方法' }), {
      status: 405,
      headers
    });

  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers
    });
  }
};

export const config = {
  path: '/api/trainings/*'
};
