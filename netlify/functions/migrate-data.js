// ==================== 数据迁移API - Netlify Functions ====================
// 用于从localStorage迁移数据到Netlify Blobs

import { getStore } from '@netlify/blobs';

// CORS headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

export default async (req, context) => {
  // 处理 OPTIONS 请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: '只支持POST请求' }), {
      status: 405,
      headers
    });
  }

  try {
    // 获取用户名（支持多用户）
    const url = new URL(req.url);
    const username = url.searchParams.get('username') || req.headers.get('X-Username') || 'default';
    
    const body = await req.json();
    const { members, trainings } = body;

    if (!members || !trainings) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: '缺少必要数据：members 或 trainings' 
      }), {
        status: 400,
        headers
      });
    }

    // 获取 Blobs store
    const store = getStore('fitness-data');

    // 使用用户名前缀保存数据
    const membersKey = `${username}_members`;
    const trainingsKey = `${username}_trainings`;

    // 保存会员数据
    await store.setJSON(membersKey, members);
    
    // 保存训练记录
    await store.setJSON(trainingsKey, trainings);

    return new Response(JSON.stringify({ 
      success: true, 
      message: '数据迁移成功',
      stats: {
        membersCount: members.length,
        trainingsCount: trainings.length,
        username: username
      }
    }), {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Migration Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers
    });
  }
};

export const config = {
  path: '/api/migrate'
};
