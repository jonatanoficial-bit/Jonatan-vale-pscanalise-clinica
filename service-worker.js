
const CACHE_NAME = 'jonatan-vale-psicanalise-v1';
const urlsToCache = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './assets/img/jonatan-transparent.png',
  './assets/img/jonatan-square.png',
  './assets/img/logo-clinica.png',
  './assets/img/whatsapp-qr.jpeg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
