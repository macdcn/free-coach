// Service Worker 版本
const CACHE_VERSION = 'v1.0.4';
const CACHE_NAME = `fitness-member-system-${CACHE_VERSION}`;

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/training-list.html',
  '/finance.html',
  '/data-management.html',
  '/training.html',
  '/training-report.html',
  '/css/style.css',
  '/js/auth.js',
  '/js/data.js',
  '/js/members.js',
  '/js/training.js',
  '/js/templates.js',
  '/js/training-data.js',
  '/js/training-list.js',
  '/js/training-page.js',
  '/js/training-report.js',
  '/js/finance.js',
  '/js/data-management.js',
  '/js/demo-data.js',
  '/js/pwa-register.js',
  '/manifest.json'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('[Service Worker] 安装中...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] 开始缓存资源');
        // 使用 Promise.all 来缓存，遇到错误也继续
        return Promise.all(
          STATIC_ASSETS.map(url => {
            return cache.add(url).catch(err => {
              console.warn('[Service Worker] 缓存失败:', url, err);
            });
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] 安装完成');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] 安装失败:', error);
      })
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] 激活中...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] 删除旧缓存:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] 激活完成');
        return self.clients.claim(); // 立即控制所有页面
      })
  );
});

// 拦截请求 - 缓存优先策略
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 只处理同源请求
  if (url.origin !== location.origin) {
    // 对于外部资源（如 CDN），使用网络优先策略
    event.respondWith(
      fetch(request)
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // 对于本地资源，使用缓存优先策略
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // 返回缓存，同时在后台更新缓存
          fetchAndCache(request);
          return cachedResponse;
        }
        
        // 如果缓存中没有，从网络获取
        return fetchAndCache(request);
      })
      .catch((error) => {
        console.error('[Service Worker] 请求失败:', error);
        
        // 如果是 HTML 页面请求失败，返回离线页面
        if (request.headers.get('Accept') && request.headers.get('Accept').includes('text/html')) {
          return caches.match('/index.html');
        }
      })
  );
});

// 从网络获取并缓存
function fetchAndCache(request) {
  return fetch(request)
    .then((response) => {
      // 检查响应是否有效
      if (!response || response.status !== 200 || response.type === 'error') {
        return response;
      }

      // 克隆响应，因为响应只能使用一次
      const responseToCache = response.clone();

      caches.open(CACHE_NAME)
        .then((cache) => {
          cache.put(request, responseToCache);
        });

      return response;
    });
}

// 监听消息事件
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// 后台同步事件（可选）
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    console.log('[Service Worker] 后台同步数据');
    // 这里可以添加数据同步逻辑
  }
});
