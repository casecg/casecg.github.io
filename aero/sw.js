/* Increase VERSION whenever you publish changed assets. Scope is this repo path. */
const VERSION = 'aero-v5';
const CACHE = VERSION + ':' + self.registration.scope;
const FILES = ['./','./index.html','./styles.css','./app.js','./hosted-browser.js','./games.js','./welcome.html','./assets/favicon.svg','./assets/wallpaper.webp'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('aero-')&&key.endsWith(':'+self.registration.scope)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const url = new URL(event.request.url);
  url.hash = '';
  if(event.request.method!=='GET'||url.origin!==self.location.origin)return;
  const cacheable=FILES.some(file=>new URL(file,self.registration.scope).href===url.href);
  if(!cacheable)return;
  event.respondWith(caches.open(CACHE).then(async cache=>{
    // Network-first HTML retrieves updates; cache-first immutable shell assets avoid repeat downloads.
    if(event.request.mode==='navigate'){
      try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}catch{return(await cache.match(event.request))||cache.match('./index.html');}
    }
    return(await cache.match(event.request))||fetch(event.request);
  }));
});
