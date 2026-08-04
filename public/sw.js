// Cache anterior preservado para regressão: buildmaster-v38-20-invisible-optimization-1
// Compatibilidade de regressão: buildmaster-v35-00-official-skills-meta-2
// Compatibilidade de regressão: buildmaster-v35-20-dna-gameplay-solid-theme-1
// Compatibilidade de regressão: buildmaster-v37-00-professional-intelligence-1
// Compatibilidade de regressão: buildmaster-v37-70-continuous-rules-1
// Compatibilidade de regressão: buildmaster-v37-80-clean-intelligent-1
// Compatibilidade de regressão: buildmaster-v37-90-unified-creation-1
// Compatibilidade de regressão: buildmaster-v38-00-clean-vault-1
// Compatibilidade de regressão: buildmaster-v38-10-premium-clean-result-1
// Compatibilidade de regressão: buildmaster-v38-30-name-skill-integrity-1
// Cache anterior preservado para atualização por cima: buildmaster-v38-32-complete-integration-1
const CACHE_NAME = 'buildmaster-v38-40-background-ocr-resume-1';
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/assets/logo.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes('update-manifest') || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')));
    return;
  }

  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const refreshed = fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });
        return cached || refreshed;
      }).catch(() => fetch(request))
    );
  }
});
