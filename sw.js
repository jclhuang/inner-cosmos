const C='nguy-v4',F=['./','index.html','style.css','app.js','config.js','manifest.webmanifest','data/days.json','data/map.json','data/qa.json','data/videos.json','data/meditation.json','icons/apple-touch-icon.png','icons/maskable-192.png','icons/maskable-512.png','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r}).catch(()=>caches.match(e.request)))});
