// 使用 Netlify Edge Functions 存储密码
// 简单的键值存储方案

import { getStore } from "@netlify/blobs";

export default async (request, context) => {
  const store = getStore("passwords");
  const url = new URL(request.url);
  
  // CORS 头
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // 处理 OPTIONS 请求
  if (request.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // GET - 获取密码
    if (request.method === "GET") {
      const password = await store.get("app-password");
      return new Response(
        JSON.stringify({ 
          success: true, 
          password: password || "123456" 
        }),
        { 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    // POST - 设置密码
    if (request.method === "POST") {
      const body = await request.json();
      const { password } = body;

      if (!password || password.length < 6) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "密码至少需要6位" 
          }),
          { 
            status: 400,
            headers: { 
              ...corsHeaders,
              "Content-Type": "application/json" 
            } 
          }
        );
      }

      await store.set("app-password", password);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "密码已保存" 
        }),
        { 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    // PUT - 修改密码
    if (request.method === "PUT") {
      const body = await request.json();
      const { currentPassword, newPassword } = body;

      // 验证当前密码
      const storedPassword = await store.get("app-password") || "123456";
      
      if (currentPassword !== storedPassword) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "当前密码错误" 
          }),
          { 
            status: 401,
            headers: { 
              ...corsHeaders,
              "Content-Type": "application/json" 
            } 
          }
        );
      }

      if (!newPassword || newPassword.length < 6) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: "新密码至少需要6位" 
          }),
          { 
            status: 400,
            headers: { 
              ...corsHeaders,
              "Content-Type": "application/json" 
            } 
          }
        );
      }

      // 保存新密码
      await store.set("app-password", newPassword);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "密码修改成功" 
        }),
        { 
          headers: { 
            ...corsHeaders,
            "Content-Type": "application/json" 
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "方法不支持" 
      }),
      { 
        status: 405,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );

  } catch (error) {
    console.error("Password store error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "服务器错误" 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        } 
      }
    );
  }
};

export const config = { path: "/api/password" };
