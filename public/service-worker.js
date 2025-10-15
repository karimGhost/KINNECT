// public/service-worker.js

// Define your cache name
const CACHE = "blabzio-cache-v1";

// Import Workbox (used by PWABuilder & Play Store Trusted Web Activity)
importScripts('https://storage.googleapis.com/workbox-cdn/releases/5.1.2/workbox-sw.js');

// Skip waiting if a new SW is installed
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

// ✅ Precache essential static assets
const urlsToCache = [
  "/",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(urlsToCache))
  );
});

// ✅ Runtime caching using Workbox
if (workbox) {
  console.log("Workbox is loaded 🎉");

  // Cache all navigation requests (your app pages)
  workbox.routing.registerRoute(
    new workbox.routing.NavigationRoute(
      new workbox.strategies.NetworkFirst({
        cacheName: `${CACHE}-pages`,
      })
    )
  );

  // Cache static assets like images, CSS, JS
  workbox.routing.registerRoute(
    /\.(?:png|jpg|jpeg|svg|gif|css|js|woff2)$/,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: `${CACHE}-assets`,
    })
  );
} else {
  console.log("Workbox didn't load 😢");
}

// ✅ Clean old caches on activate
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
