// 缓存名称
const CACHE_NAME = 'notes-app-v1';

// 需要缓存的资源列表
const CACHE_ASSETS = [
  '/notenew.html',
  '/manifest-notes.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/font-awesome@4.7.0/css/font-awesome.min.css'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(CACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => self.clients.claim())
  );
});

//  fetch 事件 - 缓存优先策略
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // 如果缓存中有响应，直接返回
        if (response) {
          return response;
        }
        
        // 否则，从网络获取
        return fetch(event.request)
          .then((response) => {
            // 检查响应是否有效
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }
            
            // 克隆响应，因为响应流只能使用一次
            const responseToCache = response.clone();
            
            // 将响应添加到缓存
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
            
            return response;
          })
          .catch(() => {
            // 如果网络请求失败，返回离线页面
            if (event.request.mode === 'navigate') {
              return caches.match('/notenew.html');
            }
          });
      })
  );
});

// 后台同步事件 - 用于同步数据
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-notes') {
    event.waitUntil(syncNotes());
  }
});

// 同步笔记函数
async function syncNotes() {
  // 这里可以实现与服务器同步数据的逻辑
  // 例如，将本地存储的笔记发送到服务器
  console.log('Syncing notes...');
}

// 推送通知事件
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body,
    icon: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=note%20app%20icon%20simple%20flat%20design%20gray%20color&image_size=square',
    badge: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=note%20app%20icon%20simple%20flat%20design%20gray%20color&image_size=square',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/notenew.html'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || '本地笔记', options)
  );
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});