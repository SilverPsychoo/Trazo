// Runtime cache contains app resources only. User photos/results are never persisted.
const CACHE='trazo-assets-2026-09-auto2';
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('trazo-assets-')&&key!==CACHE)await caches.delete(key);
  await self.clients.claim();
})()));
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  if(!/\.(?:wasm|mjs|onnx|woff2?|css|js)$/.test(url.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE),hit=await cache.match(event.request);
    if(hit)return hit;
    const response=await fetch(event.request);
    if(response.ok)try{await cache.put(event.request,response.clone())}catch{}
    return response;
  })());
});
