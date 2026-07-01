const PRISM_CACHE = "prism-v6-7-plugin-fix-20260701";
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
  const isJson = pathname.endsWith("/menu.json") || pathname.endsWith(".plugin.json");
  const shouldCache = isJson || AUDIO_RE.test(pathname) || ASSET_RE.test(pathname);
  if(!shouldCache) return;

  event.respondWith((async () => {
    const cache = await caches.open(PRISM_CACHE);

    // JSON and JS/CSS should prefer latest network version so new cards appear immediately.
    if(isJson || /\.(js|css)$/i.test(pathname)){
      try{
        const fresh = await fetch(req, {cache:"no-store"});
        if(fresh && fresh.ok) cache.put(req, fresh.clone()).catch(()=>{});
        return fresh;
      }catch(e){
        const cached = await cache.match(req);
        if(cached) return cached;
        throw e;
      }
    }

    // Large media can stay cache-first after it exists.
    const cached = await cache.match(req);
    if(cached) return cached;

    try{
      const res = await fetch(req, {cache:"reload"});
      if(res && res.ok) cache.put(req, res.clone()).catch(()=>{});
      return res;
    }catch(e){
      if(cached) return cached;
      throw e;
    }
  })());
});
