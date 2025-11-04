/* sw.js — simple static cache */
const CACHE_NAME = 'goldcal-v1';
const ASSETS = [
  '/', // root index.html
  '/index.html',
  '/assets/css/styles.css',
  '/assets/js/app.js',
  '/assets/images/logo.png',
  '/assets/images/shine.png',
  '/assets/images/hero-bg.webp'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', (e)=> {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => k!==CACHE_NAME ? caches.delete(k) : null)))
  );
  self.clients.claim();
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(
    caches.match(e.request).then(res => res || fetch(e.request).catch(()=> caches.match('/index.html')))
  );
});
