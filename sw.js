const CACHE_NAME = 'pomodoro-timer-v6';
const ASSETS = ['./', './index.html', './manifest.json', './reset.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

async function injectResetControl(response) {
  if (!response || !response.ok) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  try {
    const html = await response.text();
    if (html.includes('reset.js')) return new Response(html, {status: response.status, statusText: response.statusText, headers: response.headers});
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(html.replace('</body>', '<script src="./reset.js"></script></body>'), {status: response.status, statusText: response.statusText, headers});
  } catch (_) { return response; }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isDocument = event.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/');
  if (isDocument) {
    event.respondWith(fetch(event.request).then(async (response) => {
      const processed = await injectResetControl(response.clone());
      caches.open(CACHE_NAME).then((cache) => cache.put(event.request, processed.clone()));
      return processed;
    }).catch(async () => injectResetControl(await caches.match(event.request) || await caches.match('./index.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request).then((response) => { const copy = response.clone(); caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)); return response; })));
});
