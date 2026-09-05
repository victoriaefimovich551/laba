// ========== SERVICE WORKER ДЛЯ ОФЛАЙН-РЕЖИМА ==========
const CACHE_NAME = 'qr-scanner-v6';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './html5-qrcode.min.js'
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
         url.includes('onrender.com') ||
         url.includes('api.mylaba.com') ||
         url.includes('qrserver.com') ||
         url.includes('?action=') ||
         url.includes('?serial=');
}

// Перехват запросов
self.addEventListener('fetch', event => {
  const url = event.request.url;

  // API-запросы — ТОЛЬКО сеть, без кэширования
  if (isApiRequest(url)) {
    event.respondWith(fetch(event.request));
    return;
  }

  // HTML-страницы, а также ВСЕ свои файлы сайта (CSS/JS/JSON — то, что мы
  // сами постоянно правим) — сначала сеть, чтобы после каждой загрузки
  // новой версии на GitHub Pages изменения были видны сразу, без ручного
  // сброса кэша. Кэш — только резерв при отсутствии сети (офлайн-режим).
  // Cache-first оставляем только для чужих библиотек с CDN (unpkg и т.п.) —
  // они версионированы в самом URL и не меняются задним числом.
  const isOwnFile = url.startsWith(self.location.origin);
  if (event.request.mode === 'navigate' || event.request.destination === 'document' || isOwnFile) {
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

  // Чужие статические ресурсы (шрифты, библиотеки с CDN и т.п.) — cache-first,
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
