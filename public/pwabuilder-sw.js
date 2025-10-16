// Combined offline experience: Offline page + cached assets
const CACHE = "pwa-offline-v2";
const offlineFallbackPage = "offline.html";

// Import Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

// Skip waiting immediately on update
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// 🗂️ Assets to pre-cache (adjust as needed)
const PRECACHE_ASSETS = [
  "/",                // Home page
  "/offline.html",    // Offline fallback
  "/favicon.ico",     // App icon
  "/manifest.json",   // PWA manifest
  "/logo192.png",     // Example image/logo
  "/logo512.png"      // Larger app icon
];

// Install & cache core assets
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      console.log("[SW] Precaching core assets...");
      await cache.addAll(PRECACHE_ASSETS);
    })()
  );
  self.skipWaiting();
});

// Enable navigation preload
if (workbox.navigationPreload.isSupported()) {
  workbox.navigationPreload.enable();
}

// Runtime caching strategy: use network first, fallback to cache
workbox.routing.registerRoute(
  new RegExp("/.*"),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: CACHE,
  })
);

// Handle offline navigation requests
self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const preloadResp = await event.preloadResponse;
          if (preloadResp) return preloadResp;

          const networkResp = await fetch(event.request);
          return networkResp;
        } catch (error) {
          console.warn("[SW] Network failed, serving offline page.");
          const cache = await caches.open(CACHE);
          const cachedResp = await cache.match(offlineFallbackPage);
          return cachedResp;
        }
      })()
    );
  }
});
