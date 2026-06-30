const PRISM_CACHE = "prism-v6-2-cache";
const AUDIO_RE = /\.(mp3|m4a|wav|ogg)$/i;
const ASSET_RE = /\.(css|js|png|jpg|jpeg|webp|gif|svg|ttf|woff2?)$/i;

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith("prism-") && k !== PRISM_CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  const pathname = url.pathname;
  const shouldCache = AUDIO_RE.test(pathname) || ASSET_RE.test(pathname) || pathname.endsWith("/menu.json");
  if(!shouldCache) return;

  event.respondWith((async () => {
    const cache = await caches.open(PRISM_CACHE);
    const cached = await cache.match(req);
    if(cached) return cached;
    try{
      const res = await fetch(req, {cache:"force-cache"});
      if(res && res.ok) cache.put(req, res.clone()).catch(()=>{});
      return res;
    }catch(e){
      if(cached) return cached;
      throw e;
    }
  })());
});
