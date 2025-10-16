// public/service-worker.js

// Define cache name
const CACHE = "kinnect-cache-v1";

// Import Workbox (used by PWABuilder / TWA)
importScripts("https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js");

// Skip waiting when a new SW version is available
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ✅ Precache essential static assets
const urlsToCache = [
  "/",
  "/manifest.json",
  "/icons/android-chrome-192x192.png",
  "/icons/android-chrome-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(urlsToCache))
  );
});

// ✅ Use Workbox for runtime caching
if (typeof workbox !== "undefined") {
  console.log("Workbox is loaded 🎉");

  // Cache navigations (app shell)
  workbox.routing.registerRoute(
    new workbox.routing.NavigationRoute(
      new workbox.strategies.NetworkFirst({
        cacheName: `${CACHE}-pages`,
      })
    )
  );

  // Cache static assets (images, css, js, fonts)
  workbox.routing.registerRoute(
    /\.(?:png|jpg|jpeg|svg|gif|css|js|woff2|webp)$/,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: `${CACHE}-assets`,
    })
  );
} else {
  console.log("Workbox didn't load 😢");
}

// ✅ Clean old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE && name.startsWith("kinnect-cache")) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});
