/* Safe-Alleys service worker — Phase 0 app shell cache.
   Strategy: cache-first for same-origin assets; network passthrough for map tiles/CDN (tile caching with quota in a later phase). */
var CACHE = "safealleys-v1";
var CORE = [
  "/", "/index.html", "/privacy.html", "/style.css", "/app.js",
  "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  if (url.origin !== location.origin) return; // tiles, CDN: network only for now
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      if (hit) {
        // stale-while-revalidate in the background
        fetch(e.request).then(function (r) {
          if (r && r.ok) caches.open(CACHE).then(function (c) { c.put(e.request, r); });
        }).catch(function () {});
        return hit;
      }
      return fetch(e.request).then(function (r) {
        if (r && r.ok && (e.request.mode === "navigate" || url.pathname.startsWith("/icons") || CORE.indexOf(url.pathname) >= 0)) {
          var copy = r.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request.mode === "navigate" ? new Request("/") : e.request, copy); });
        }
        return r;
      }).catch(function () {
        return caches.match("/") || caches.match("/index.html");
      });
    })
  );
});
