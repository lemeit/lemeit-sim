'use strict';
// La interfaz se obtiene de la red: no guardar versiones viejas ni respuestas del motor.
const OFFLINE_CACHE='sim-offline-0.4.0';
self.addEventListener('install',event=>{event.waitUntil(caches.open(OFFLINE_CACHE).then(cache=>cache.addAll(['/offline.html','/offline.css'])));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('sim-offline-')&&key!==OFFLINE_CACHE).map(key=>caches.delete(key)))));});
self.addEventListener('fetch',event=>{
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin||event.request.method!=='GET'||url.pathname.startsWith('/api/'))return;
  if(url.pathname==='/offline.css'){event.respondWith(fetch(event.request).catch(()=>caches.match('/offline.css')));return;}
  if(event.request.mode!=='navigate')return;
  event.respondWith(fetch(event.request).catch(async()=>await caches.match('/offline.html')||new Response('ΣIM necesita conexión para abrir la interfaz.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}})));
});
