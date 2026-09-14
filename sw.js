const CACHE='sami-spatial-v0.6.0';
const SHELL=['./','./index.html','./styles.css','./app.js','./geometry.js','./sami-qrcode.js','./document-engine.js','./QR-CODE-LICENSE.txt','./polygon-clipping.js','./leaflet.js','./leaflet.css','./layers.png','./layers-2x.png','./marker-icon.png','./marker-icon-2x.png','./marker-shadow.png','./config.js','./manifest.webmanifest','./sami-wordmark.png','./sami-mark.png','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('sami-spatial-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==location.origin)return;
 const known=SHELL.some(p=>new URL(p,self.registration.scope).pathname===u.pathname);if(!known)return;
 // Network first for the app shell so upgrades are not trapped in an old cache.
 e.respondWith(fetch(e.request).then(r=>{if(r.ok){const clone=r.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,clone)));}return r;}).catch(()=>caches.match(e.request)));
});
