const CACHE_NAME = 'melipomapa-v1';
const URLS_PARA_CACHE = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,500;0,700;1,300&family=DM+Mono:wght@400;500&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
];

// Instalar e fazer cache dos arquivos principais
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(URLS_PARA_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

// Ativar e limpar caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Interceptar requisições — cache first para assets, network first para mapas
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Tiles do mapa — sempre busca da rede (precisa de internet)
  if (url.hostname.includes('tile.openstreetmap') || url.hostname.includes('arcgisonline')) {
    event.respondWith(fetch(event.request).catch(() => new Response('')));
    return;
  }

  // Para o resto — tenta cache primeiro, depois rede
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
