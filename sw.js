const C='lana-v8';
const A=['/','/index.html','/style.css','/app.js','/manifest.json'];
self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET') return;
  const isPage=e.request.mode==='navigate' || e.request.destination==='document';
  if(isPage){
    e.respondWith(fetch(e.request).then(r=>{
      const copy=r.clone(); caches.open(C).then(c=>c.put(e.request,copy)); return r;
    }).catch(()=>caches.match(e.request).then(r=>r||caches.match('/'))));
    return;
  }
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
    const copy=resp.clone(); caches.open(C).then(c=>c.put(e.request,copy)); return resp;
  })));
});