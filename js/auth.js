// 认证检查脚本（简化版 - 自动登录）
(function() {
  'use strict';

  // 检查是否在登录或注册页面
  const isLoginPage = window.location.pathname.endsWith('login.html');
  const isRegisterPage = window.location.pathname.endsWith('register.html');
  
  // 如果在登录/注册页面，直接跳转到主页
  if (isLoginPage || isRegisterPage) {
    window.location.href = 'index.html';
    return;
  }

  // 自动设置登录状态（无需用户操作）
  function ensureAutoLogin() {
    const loginStatus = sessionStorage.getItem('login-status');
    
    if (!loginStatus || loginStatus !== 'true') {
      // 自动登录
      const loginTime = Date.now();
      const expireTime = loginTime + (365 * 24 * 60 * 60 * 1000); // 1年有效期
      
      sessionStorage.setItem('login-status', 'true');
      sessionStorage.setItem('login-time', loginTime.toString());
      sessionStorage.setItem('login-expire', expireTime.toString());
      
      // 设置默认用户
      const defaultUser = {
        username: 'default',
        displayName: '本地用户'
      };
      sessionStorage.setItem('currentUser', JSON.stringify(defaultUser));
    }
  }

  // 执行自动登录
  ensureAutoLogin();

  // 添加退出登录功能（保留，但不显示）
  window.logout = function() {
    const confirmed = confirm('确定要清除登录状态吗？（下次访问会自动重新登录）');
    if (confirmed) {
      sessionStorage.removeItem('login-status');
      sessionStorage.removeItem('login-time');
      sessionStorage.removeItem('login-expire');
      sessionStorage.removeItem('currentUser');
      window.location.reload();
    }
  };

})();
