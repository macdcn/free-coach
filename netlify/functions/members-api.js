// ==================== 会员数据API - Netlify Functions ====================
// 使用Netlify Blobs存储会员数据

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
    // 获取用户信息（从请求头或查询参数）
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
    const membersKey = `${username}_members`;
    
    // 解析请求
    const path = url.pathname.replace('/api/members', '');
    const method = req.method;

    // GET /api/members - 获取所有会员
    if (method === 'GET' && !path) {
      const membersData = await store.get(membersKey, { type: 'json' });
      const members = membersData || [];
      
      return new Response(JSON.stringify({ success: true, data: members }), {
        status: 200,
        headers
      });
    }

    // GET /api/members/:id - 获取单个会员
    if (method === 'GET' && path) {
      const id = parseInt(path.substring(1));
      const membersData = await store.get(membersKey, { type: 'json' });
      const members = membersData || [];
      const member = members.find(m => m.id === id);
      
      if (!member) {
        return new Response(JSON.stringify({ success: false, error: '会员不存在' }), {
          status: 404,
          headers
        });
      }
      
      return new Response(JSON.stringify({ success: true, data: member }), {
        status: 200,
        headers
      });
    }

    // POST /api/members - 添加会员
    if (method === 'POST') {
      const body = await req.json();
      const membersData = await store.get(membersKey, { type: 'json' });
      const members = membersData || [];
      
      // 获取下一个ID
      const nextId = members.length > 0 ? Math.max(...members.map(m => m.id)) + 1 : 1;
      
      const newMember = {
        id: nextId,
        ...body,
        createdAt: new Date().toISOString(),
        renewCount: 0,
        totalCourses: body.courses,
        remainingCourses: body.courses,
        totalAmount: body.amount,
        remainingAmount: body.amount,
        venueSettledTimes: 0
      };
      
      members.push(newMember);
      await store.setJSON(membersKey, members);
      
      return new Response(JSON.stringify({ success: true, data: newMember }), {
        status: 201,
        headers
      });
    }

    // PUT /api/members/:id - 更新会员
    if (method === 'PUT' && path) {
      const id = parseInt(path.substring(1));
      const body = await req.json();
      const membersData = await store.get(membersKey, { type: 'json' });
      const members = membersData || [];
      const index = members.findIndex(m => m.id === id);
      
      if (index === -1) {
        return new Response(JSON.stringify({ success: false, error: '会员不存在' }), {
          status: 404,
          headers
        });
      }
      
      members[index] = { ...members[index], ...body };
      await store.setJSON(membersKey, members);
      
      return new Response(JSON.stringify({ success: true, data: members[index] }), {
        status: 200,
        headers
      });
    }

    // DELETE /api/members/:id - 删除会员
    if (method === 'DELETE' && path) {
      const id = parseInt(path.substring(1));
      const membersData = await store.get(membersKey, { type: 'json' });
      const members = membersData || [];
      const filtered = members.filter(m => m.id !== id);
      
      if (filtered.length === members.length) {
        return new Response(JSON.stringify({ success: false, error: '会员不存在' }), {
          status: 404,
          headers
        });
      }
      
      await store.setJSON(membersKey, filtered);
      
      // 同时删除该会员的训练记录
      const trainingsKey = `${username}_trainings`;
      const trainingsData = await store.get(trainingsKey, { type: 'json' });
      if (trainingsData) {
        const filteredTrainings = trainingsData.filter(t => t.memberId !== id);
        await store.setJSON(trainingsKey, filteredTrainings);
      }
      
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
  path: '/api/members/*'
};
