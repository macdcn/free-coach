// PWA 注册和管理脚本
(function() {
  'use strict';

  // 检查浏览器是否支持 Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      registerServiceWorker();
    });
  } else {
    console.warn('当前浏览器不支持 Service Worker');
  }

  // 注册 Service Worker
  async function registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      console.log('✅ Service Worker 注册成功:', registration.scope);

      // 监听更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 发现新版本的 Service Worker');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // 有新版本可用
            showUpdateNotification(newWorker);
          }
        });
      });

      // 检查更新
      checkForUpdates(registration);

    } catch (error) {
      console.error('❌ Service Worker 注册失败:', error);
    }
  }

  // 定期检查更新（每小时检查一次）
  function checkForUpdates(registration) {
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000); // 1小时
  }

  // 显示更新提示
  function showUpdateNotification(worker) {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'pwa-update-banner';
    updateBanner.innerHTML = `
      <div class="pwa-update-content">
        <span class="pwa-update-icon">🔄</span>
        <span class="pwa-update-text">发现新版本</span>
        <button class="pwa-update-btn" id="pwaUpdateBtn">立即更新</button>
        <button class="pwa-update-close" id="pwaUpdateClose">×</button>
      </div>
    `;

    document.body.appendChild(updateBanner);

    // 绑定更新按钮事件
    const updateBtn = document.getElementById('pwaUpdateBtn');
    if (updateBtn) {
      updateBtn.addEventListener('click', () => {
        worker.postMessage({ type: 'SKIP_WAITING' });
        setTimeout(() => {
          window.location.reload();
        }, 100);
      });
    }

    // 绑定关闭按钮事件
    const closeBtn = document.getElementById('pwaUpdateClose');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        updateBanner.remove();
      });
    }

    // 添加样式
    if (!document.getElementById('pwa-update-styles')) {
      const styles = document.createElement('style');
      styles.id = 'pwa-update-styles';
      styles.textContent = `
        .pwa-update-banner {
          position: fixed;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10000;
          background: linear-gradient(135deg, #8B9DC3, #A8B8D8);
          color: white;
          padding: 12px 20px;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(139, 157, 195, 0.3);
          animation: slideDown 0.3s ease-out;
        }

        .pwa-update-content {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .pwa-update-icon {
          font-size: 20px;
        }

        .pwa-update-text {
          font-size: 14px;
          font-weight: 500;
        }

        .pwa-update-btn {
          background: white;
          color: #8B9DC3;
          border: none;
          padding: 6px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .pwa-update-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .pwa-update-btn:active {
          transform: scale(0.98);
        }

        .pwa-update-close {
          background: transparent;
          border: none;
          color: white;
          font-size: 24px;
          line-height: 1;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s;
        }

        .pwa-update-close:hover {
          opacity: 0.8;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }

        @media (max-width: 640px) {
          .pwa-update-banner {
            left: 10px;
            right: 10px;
            transform: none;
          }
          
          .pwa-update-content {
            gap: 8px;
          }
        }
      `;
      document.head.appendChild(styles);
    }
  }

  // 安装提示
  let deferredPrompt;

  window.addEventListener('beforeinstallprompt', (e) => {
    // 阻止默认的安装提示
    e.preventDefault();
    deferredPrompt = e;

    // 显示自定义安装按钮
    showInstallPromotion();
  });

  // 显示安装提示
  function showInstallPromotion() {
    // 检查是否已经安装
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('应用已安装');
      return;
    }

    // 检查是否已经显示过安装提示
    const hasShownInstall = localStorage.getItem('pwa-install-prompted');
    if (hasShownInstall) {
      return;
    }

    // 延迟显示安装提示（用户使用一段时间后）
    setTimeout(() => {
      const installBanner = document.createElement('div');
      installBanner.className = 'pwa-install-banner';
      installBanner.innerHTML = `
        <div class="pwa-install-content">
          <div class="pwa-install-header">
            <span class="pwa-install-icon">📱</span>
            <div class="pwa-install-text">
              <div class="pwa-install-title">安装应用到主屏幕</div>
              <div class="pwa-install-desc">获得更好的使用体验</div>
            </div>
            <button class="pwa-install-close" id="pwaInstallClose">×</button>
          </div>
          <div class="pwa-install-actions">
            <button class="pwa-install-btn-secondary" id="pwaInstallDismiss">稍后再说</button>
            <button class="pwa-install-btn-primary" id="pwaInstallConfirm">立即安装</button>
          </div>
        </div>
      `;

      document.body.appendChild(installBanner);

      // 绑定关闭按钮事件
      const closeBtn = document.getElementById('pwaInstallClose');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => {
          localStorage.setItem('pwa-install-prompted', 'true');
          installBanner.remove();
        });
      }

      // 绑定稍后再说按钮事件
      const dismissBtn = document.getElementById('pwaInstallDismiss');
      if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
          localStorage.setItem('pwa-install-prompted', 'true');
          installBanner.remove();
        });
      }

      // 绑定立即安装按钮事件
      const confirmBtn = document.getElementById('pwaInstallConfirm');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', async () => {
          if (!deferredPrompt) {
            console.warn('安装提示不可用');
            installBanner.remove();
            return;
          }

          try {
            // 显示安装提示
            await deferredPrompt.prompt();
            
            // 等待用户选择
            const { outcome } = await deferredPrompt.userChoice;
            
            console.log(`用户选择: ${outcome}`);
            
            if (outcome === 'accepted') {
              console.log('✅ 用户接受安装');
            } else {
              console.log('❌ 用户拒绝安装');
            }
            
            // 标记已显示过
            localStorage.setItem('pwa-install-prompted', 'true');
            
            // 关闭弹窗
            installBanner.remove();
            
            // 清空 deferredPrompt
            deferredPrompt = null;
            
          } catch (error) {
            console.error('安装出错:', error);
            installBanner.remove();
          }
        });
      }

      // 添加样式
      if (!document.getElementById('pwa-install-styles')) {
        const styles = document.createElement('style');
        styles.id = 'pwa-install-styles';
        styles.textContent = `
          .pwa-install-banner {
            position: fixed;
            bottom: 80px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 9999;
            background: white;
            padding: 16px;
            border-radius: 16px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.15);
            max-width: 360px;
            width: calc(100% - 40px);
            animation: slideUp 0.3s ease-out;
          }

          .pwa-install-content {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .pwa-install-header {
            display: flex;
            align-items: flex-start;
            gap: 12px;
          }

          .pwa-install-icon {
            font-size: 32px;
            flex-shrink: 0;
          }

          .pwa-install-text {
            flex: 1;
          }

          .pwa-install-title {
            font-size: 15px;
            font-weight: 600;
            color: #333;
            margin-bottom: 4px;
          }

          .pwa-install-desc {
            font-size: 13px;
            color: #666;
          }

          .pwa-install-close {
            background: transparent;
            border: none;
            color: #999;
            font-size: 24px;
            line-height: 1;
            cursor: pointer;
            padding: 0;
            width: 24px;
            height: 24px;
            flex-shrink: 0;
            transition: color 0.2s;
          }

          .pwa-install-close:hover {
            color: #666;
          }

          .pwa-install-actions {
            display: flex;
            gap: 8px;
            margin-top: 4px;
          }

          .pwa-install-btn-secondary,
          .pwa-install-btn-primary {
            flex: 1;
            padding: 10px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
          }

          .pwa-install-btn-secondary {
            background: #F0F0F0;
            color: #666;
          }

          .pwa-install-btn-secondary:hover {
            background: #E0E0E0;
          }

          .pwa-install-btn-secondary:active {
            transform: scale(0.98);
          }

          .pwa-install-btn-primary {
            background: linear-gradient(135deg, #8B9DC3, #A8B8D8);
            color: white;
          }

          .pwa-install-btn-primary:hover {
            transform: scale(1.02);
            box-shadow: 0 4px 12px rgba(139, 157, 195, 0.3);
          }

          .pwa-install-btn-primary:active {
            transform: scale(0.98);
          }

          @keyframes slideUp {
            from {
              opacity: 0;
              transform: translateX(-50%) translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateX(-50%) translateY(0);
            }
          }
        `;
        document.head.appendChild(styles);
      }
    }, 3000); // 3秒后显示安装提示
  }

  // 监听安装事件
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA 已成功安装');
    localStorage.setItem('pwa-installed', 'true');
    deferredPrompt = null;
  });

  // 检测是否在 PWA 模式下运行
  if (window.matchMedia('(display-mode: standalone)').matches) {
    console.log('✅ 应用运行在 PWA 模式');
    document.body.classList.add('pwa-mode');
  }

})();
