/* KUROKURO service worker: keep requests network-first and avoid caching private search data. */
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Never cache API responses, search queries, or cross-origin requests.
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) {
    return;
  }

  // Network-only: this worker enables app installation without retaining search history or results.
  event.respondWith(fetch(request));
});
