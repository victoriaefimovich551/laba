// ========== SERVICE WORKER ДЛЯ ОФЛАЙН-РЕЖИМА ==========
const CACHE_NAME = 'qr-scanner-v4';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js'
];

// Установка Service Worker — кэшируем файлы
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 Кэширование файлов...');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Активация — удаляем старые кэши
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Удаляем старый кэш:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Проверка: является ли запрос API-вызовом (не кэшировать)
function isApiRequest(url) {
  return url.includes('script.google.com') ||
         url.includes('qrserver.com') ||
         url.includes('?action=') ||
         url.includes('?serial=');
}

// Перехват запросов
self.addEventListener('fetch', event => {
  // API-запросы — ТОЛЬКО сеть, без кэширования
  if (isApiRequest(event.request.url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // HTML-страницы (сам сайт) — сначала сеть, чтобы обновления файлов сразу
  // были видны; кэш используется только как резерв при отсутствии сети.
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => caches.match(event.request).then(cached => cached || caches.match('./index.html')))
    );
    return;
  }

  // Остальные статические ресурсы (шрифты, библиотеки и т.п.) — cache-first,
  // с фоллбэком на сеть, это то, что реально не меняется часто.
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request)
          .then(response => {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
            return response;
          });
      })
      .catch(() => {
        return new Response('Нет соединения', {
          status: 503,
          statusText: 'Service Unavailable'
        });
      })
  );
});
