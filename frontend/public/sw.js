// Service Worker for caching optimization
const CACHE_NAME = 'crewai-studio-v1';
const STATIC_CACHE_NAME = 'crewai-studio-static-v1';
const DYNAMIC_CACHE_NAME = 'crewai-studio-dynamic-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/images/logo.svg',
  '/fonts/inter-var.woff2',
];

// 需要缓存的 API 路径
const API_CACHE_PATTERNS = [
  /^\/api\/v1\/workflow-templates/,
  /^\/api\/v1\/crews/,
  /^\/api\/v1\/llm-connections/,
];

// 缓存策略配置
const CACHE_STRATEGIES = {
  // 静态资源：缓存优先
  static: 'cache-first',
  // API 数据：网络优先，失败时使用缓存
  api: 'network-first',
  // 页面：网络优先，失败时使用缓存
  pages: 'network-first',
  // 图片：缓存优先
  images: 'cache-first',
};

// 缓存时间配置（秒）
const CACHE_DURATIONS = {
  static: 60 * 60 * 24 * 30, // 30 days
  api: 60 * 5, // 5 minutes
  pages: 60 * 60, // 1 hour
  images: 60 * 60 * 24 * 7, // 7 days
};

// 安装事件
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Static assets cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

// 激活事件
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // 删除旧版本的缓存
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('crewai-studio-')) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 只处理同源请求
  if (url.origin !== location.origin) {
    return;
  }

  // 根据请求类型选择缓存策略
  if (isStaticAsset(request)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE_NAME));
  } else if (isAPIRequest(request)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME, CACHE_DURATIONS.api));
  } else if (isImageRequest(request)) {
    event.respondWith(cacheFirst(request, DYNAMIC_CACHE_NAME));
  } else if (isPageRequest(request)) {
    event.respondWith(networkFirst(request, DYNAMIC_CACHE_NAME, CACHE_DURATIONS.pages));
  }
});

// 判断是否为静态资源
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/_next/static/') ||
         url.pathname.startsWith('/static/') ||
         url.pathname.includes('.css') ||
         url.pathname.includes('.js') ||
         url.pathname.includes('.woff') ||
         url.pathname.includes('.woff2');
}

// 判断是否为 API 请求
function isAPIRequest(request) {
  const url = new URL(request.url);
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// 判断是否为图片请求
function isImageRequest(request) {
  return request.destination === 'image' ||
         request.url.includes('.jpg') ||
         request.url.includes('.jpeg') ||
         request.url.includes('.png') ||
         request.url.includes('.webp') ||
         request.url.includes('.svg');
}

// 判断是否为页面请求
function isPageRequest(request) {
  return request.mode === 'navigate' ||
         (request.method === 'GET' && request.headers.get('accept').includes('text/html'));
}

// 缓存优先策略
async function cacheFirst(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // 检查缓存是否过期
      const cacheTime = cachedResponse.headers.get('sw-cache-time');
      if (cacheTime) {
        const age = Date.now() - parseInt(cacheTime);
        const maxAge = isStaticAsset(request) ? CACHE_DURATIONS.static * 1000 : CACHE_DURATIONS.images * 1000;
        
        if (age > maxAge) {
          // 缓存过期，尝试更新
          fetchAndCache(request, cache);
        }
      }
      
      return cachedResponse;
    }
    
    // 缓存中没有，从网络获取
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      await cacheResponse(cache, request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    return new Response('Network error', { status: 408 });
  }
}

// 网络优先策略
async function networkFirst(request, cacheName, maxAge) {
  try {
    const cache = await caches.open(cacheName);
    
    try {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        await cacheResponse(cache, request, networkResponse.clone());
      }
      
      return networkResponse;
    } catch (networkError) {
      console.log('Network failed, trying cache:', networkError);
      
      const cachedResponse = await cache.match(request);
      if (cachedResponse) {
        // 检查缓存是否过期
        const cacheTime = cachedResponse.headers.get('sw-cache-time');
        if (cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          if (age <= maxAge * 1000) {
            return cachedResponse;
          }
        } else {
          // 没有时间戳的缓存也返回
          return cachedResponse;
        }
      }
      
      throw networkError;
    }
  } catch (error) {
    console.error('Network first strategy failed:', error);
    return new Response('Network error', { status: 408 });
  }
}

// 缓存响应
async function cacheResponse(cache, request, response) {
  // 添加缓存时间戳
  const responseWithTimestamp = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: {
      ...Object.fromEntries(response.headers.entries()),
      'sw-cache-time': Date.now().toString(),
    },
  });
  
  await cache.put(request, responseWithTimestamp);
}

// 后台获取并缓存
async function fetchAndCache(request, cache) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      await cacheResponse(cache, request, response.clone());
    }
  } catch (error) {
    console.log('Background fetch failed:', error);
  }
}

// 清理过期缓存
async function cleanupExpiredCache() {
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    if (cacheName.startsWith('crewai-studio-')) {
      const cache = await caches.open(cacheName);
      const requests = await cache.keys();
      
      for (const request of requests) {
        const response = await cache.match(request);
        const cacheTime = response.headers.get('sw-cache-time');
        
        if (cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          let maxAge = CACHE_DURATIONS.static * 1000;
          
          if (isAPIRequest(request)) {
            maxAge = CACHE_DURATIONS.api * 1000;
          } else if (isImageRequest(request)) {
            maxAge = CACHE_DURATIONS.images * 1000;
          } else if (isPageRequest(request)) {
            maxAge = CACHE_DURATIONS.pages * 1000;
          }
          
          if (age > maxAge) {
            await cache.delete(request);
            console.log('Deleted expired cache:', request.url);
          }
        }
      }
    }
  }
}

// 定期清理过期缓存（每小时）
setInterval(cleanupExpiredCache, 60 * 60 * 1000);

// 监听消息
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'CLEANUP_CACHE') {
    cleanupExpiredCache();
  }
});