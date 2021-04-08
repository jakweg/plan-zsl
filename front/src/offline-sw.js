const cacheName = 'v3';

const preCachedResources = [
  '/assets/font.ttf',
  '/assets/bookmark-empty.svg',
  '/assets/bookmark-fill.svg',
  '/assets/share.svg',
];


self.addEventListener('install', event => {
  // noinspection JSUnresolvedFunction
  event.waitUntil(async () => {
    const cache = await caches.open(cacheName);

    await cache.put('/', await fetch('/'));
    await Promise.all(preCachedResources
      .map(url => fetch(url)
        .then(res => cache.put(url, res))));

  });
});

const doNetworkThenCacheRequest = (requested, rewriteTo = requested.url) => {
  return new Promise(async (sendResponse, reject) => {
    const signal = new AbortController();
    const request = fetch(requested, {
      signal: signal.signal
    });

    let finished = false;
    let error = null;
    const cache = caches.open(cacheName);

    setTimeout(async () => {
      if (finished) return;
      const fromCache = await (await cache).match(rewriteTo);
      if (finished) return;

      signal.abort();
      finished = true;
      if (fromCache)
        sendResponse(fromCache);
      else
        reject(error);
    }, 3000);



    try {
      const response = await request;
      if (!finished) {
        finished = true;
        sendResponse(response.clone());
        await (await cache).put(rewriteTo, response)
      }
    } catch (e) {
      error = e;
      if (!finished) {
        finished = true;
        sendResponse(await (await cache).match(rewriteTo))
      }
    }
  })
};

self.addEventListener('fetch', async event => {
  // noinspection JSUnresolvedVariable
  const path = event.request.url.substring(event.request.url.indexOf('/', 8) + 1);


  // noinspection JSUnresolvedVariable
  if (path.endsWith('-sw.js') ||
    path.startsWith('api/') ||
    path.startsWith('sockjs') ||
    path.startsWith('favicon') ||
    event.request.url.startsWith('http://192.168.1.22:6823/'))
    return;

  if (path.startsWith('assets/') ||
    path.endsWith('.css') ||
    path.endsWith('.js') ||
    path.endsWith('.json')) {

    // this request should be network first, cache second
    // noinspection JSUnresolvedFunction,JSUnresolvedVariable
    event.respondWith(doNetworkThenCacheRequest(event.request));
  } else {
    // probably requested document, so return  '/' that is 'index.html'
    // noinspection JSUnresolvedFunction,JSUnresolvedVariable
    event.respondWith(doNetworkThenCacheRequest(event.request, '/'));
  }
});
