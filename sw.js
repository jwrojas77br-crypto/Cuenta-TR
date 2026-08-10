const IS_DEV =
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname === 'localhost';

const CACHE_VERSION = 'cuenta-tr-v11';
const APP_SHELL_CACHE = `app-shell-${CACHE_VERSION}`;
const OFFLINE_URL = './offline.html';

const APP_SHELL_ASSETS = [
  './',
  './index.html',
  './HTML/login.html',
  './HTML/nuevoAcceso.html',
  './HTML/wallet.html',
  './offline.html',
  './manifest.webmanifest',

  './CSS/index.css',
  './CSS/login.css',
  './CSS/claveNueva.css',
  './CSS/wallet.css',

  './JS/pwa.js',
  './JS/vendor/simplewebauthn-browser.js',
  './JS/passkey/passkeyService.js',

  './JS/login/login/loginService.js',
  './JS/login/login/loginController.js',
  './JS/login/login/loginUI.js',

  './JS/login/nuevoAcceso/nuevoAccesoService.js',
  './JS/login/nuevoAcceso/nuevoAccesoController.js',
  './JS/login/nuevoAcceso/nuevoAccesoUI.js',

  './JS/wallet/walletService.js',
  './JS/wallet/walletController.js',
  './JS/wallet/walletUI.js',

  './HTML/olvideClave.html',
  './CSS/olvideClave.css',
  './JS/config/appConfig.js',
  './JS/login/olvideClave/olvideClaveService.js',
  './JS/login/olvideClave/olvideClaveController.js',
  './JS/login/olvideClave/olvideClaveUI.js',

  './img/TR Icono.png',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  if (IS_DEV) {
    // En desarrollo no precacheamos nada
    event.waitUntil(self.skipWaiting());
    return;
  }

  event.waitUntil(
    caches
      .open(APP_SHELL_CACHE)
      .then((cache) => cache.addAll(APP_SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== APP_SHELL_CACHE)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  // Modo desarrollo: siempre red
  if (IS_DEV) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Producción: navegación con network-first + fallback offline
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(APP_SHELL_CACHE).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(async () => {
          const cachedPage = await caches.match(event.request);
          return cachedPage || caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // Producción: recursos estáticos cache-first
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const responseClone = response.clone();
            caches.open(APP_SHELL_CACHE).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.destination === 'document') {
            return caches.match(OFFLINE_URL);
          }

          return new Response('', {
            status: 503,
            statusText: 'Offline'
          });
        });
    })
  );
});
