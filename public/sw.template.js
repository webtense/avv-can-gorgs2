const CACHE_NAME = '__CACHE_NAME__';
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
});
