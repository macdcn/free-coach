// ==================== 用户管理API - Netlify Functions ====================
// 支持多用户注册和登录

import { getStore } from '@netlify/blobs';

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Content-Type': 'application/json'
};

export default async (req, context) => {
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  try {
    const store = getStore('fitness-users');
    const url = new URL(req.url);
    const path = url.pathname.replace('/api/user', '');

    // POST /api/user/register - 注册新用户
    if (req.method === 'POST' && path === '/register') {
      const { username, password, displayName } = await req.json();

      if (!username || !password) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: '用户名和密码不能为空' 
        }), { status: 400, headers });
      }

      // 检查用户是否已存在
      const usersData = await store.get('users', { type: 'json' });
      const users = usersData || [];
      
      if (users.find(u => u.username === username)) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: '用户名已存在' 
        }), { status: 400, headers });
      }

      // 创建新用户
      const newUser = {
        id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
        username,
        password, // 注意：实际应用中应该使用hash
        displayName: displayName || username,
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      await store.setJSON('users', users);

      return new Response(JSON.stringify({ 
        success: true, 
        message: '注册成功',
        user: {
          id: newUser.id,
          username: newUser.username,
          displayName: newUser.displayName
        }
      }), { status: 201, headers });
    }

    // POST /api/user/login - 用户登录
    if (req.method === 'POST' && path === '/login') {
      const { username, password } = await req.json();

      if (!username || !password) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: '用户名和密码不能为空' 
        }), { status: 400, headers });
      }

      // 验证用户
      const usersData = await store.get('users', { type: 'json' });
      const users = usersData || [];
      const user = users.find(u => u.username === username && u.password === password);

      if (!user) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: '用户名或密码错误' 
        }), { status: 401, headers });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        message: '登录成功',
        user: {
          id: user.id,
          username: user.username,
          displayName: user.displayName
        }
      }), { status: 200, headers });
    }

    // GET /api/user/check - 检查用户名是否存在
    if (req.method === 'GET' && path.startsWith('/check')) {
      const username = url.searchParams.get('username');
      
      if (!username) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: '缺少用户名参数' 
        }), { status: 400, headers });
      }

      const usersData = await store.get('users', { type: 'json' });
      const users = usersData || [];
      const exists = users.some(u => u.username === username);

      return new Response(JSON.stringify({ 
        success: true, 
        exists 
      }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ 
      success: false, 
      error: '不支持的请求' 
    }), { status: 405, headers });

  } catch (error) {
    console.error('User API Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), { status: 500, headers });
  }
};

export const config = {
  path: '/api/user/*'
};
