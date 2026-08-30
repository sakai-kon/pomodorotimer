const CACHE_NAME = 'pomodoro-timer-v9';
const ASSETS = ['./', './index.html', './manifest.json', './reset.js', './storage-guard.js'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

async function injectControls(response) {
  if (!response || !response.ok) return response;
  const type = response.headers.get('content-type') || '';
  if (!type.includes('text/html')) return response;
  try {
    const html = await response.text();
    let result = html;

    // Preserve the existing UI, but fix the old load() branch that erased all
    // history whenever the calendar date changed. A PWA restart must never
    // behave like a data reset.
    const oldResetBranch = "else{mode='work';secondsLeft=duration('work');running=false;endAt=null;sessionCount=0;totalStudySeconds=0;history=[];sessions=[];daily={}}";
    const safeBranch = "else{mode=['work','short','long'].includes(s.mode)?s.mode:'work';secondsLeft=Math.max(0,+s.secondsLeft||duration(mode));running=s.running===true;endAt=+s.endAt||null;sessionCount=Array.isArray(s.sessions)?s.sessions.filter(x=>x&&x.date===dateKey()).length:0;totalStudySeconds=Array.isArray(s.sessions)?s.sessions.filter(x=>x&&x.date===dateKey()).reduce((a,x)=>a+(+x.minutes||0)*60,0):0;history=Array.isArray(s.history)?s.history.slice(0,30):[];sessions=Array.isArray(s.sessions)?s.sessions.slice(-200):[];daily=s.daily&&typeof s.daily==='object'?s.daily:{}}";
    result = result.replace(oldResetBranch, safeBranch);

    if (!result.includes('storage-guard.js')) {
      result = result.replace('</head>', '<script src="./storage-guard.js"></script></head>');
    }
    if (!result.includes('reset.js')) {
      result = result.replace('</body>', '<script src="./reset.js"></script></body>');
    }

    if (result === html) return response;
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    return new Response(result, { status: response.status, statusText: response.statusText, headers });
  } catch (_) {
    return response;
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const isDocument = event.request.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/');

  if (isDocument) {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          const processed = await injectControls(response.clone());
          const cache = await caches.open(CACHE_NAME);
          await cache.put(event.request, processed.clone());
          return processed;
        })
        .catch(async () => {
          const cached = await caches.match(event.request) || await caches.match('./index.html');
          return injectControls(cached);
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      });
    })
  );
});
