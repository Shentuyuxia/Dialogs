// 话题扭蛋 Topic Capsules – offline cache. Bump VERSION whenever index.html changes.
const VERSION = "tt-v13";
const CORE = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/icon-512.png", "./icons/apple-touch-icon.png"];
self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const url = new URL(r.url);
  const same = url.origin === location.origin;
  const cdn = /(^|\.)(fonts\.googleapis\.com|fonts\.gstatic\.com|cdn\.jsdelivr\.net)$/.test(url.hostname);
  if (!same && !cdn) return;
  // the page itself: network first, so updates arrive; cache as fallback offline
  if (same && (r.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html"))) {
    e.respondWith(fetch(r).then(res => { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)); return res; })
      .catch(() => caches.match(r, { ignoreSearch: true }).then(m => m || caches.match("./index.html"))));
    return;
  }
  // everything else (icons, fonts, opencc): cache first
  e.respondWith(caches.match(r).then(m => m || fetch(r).then(res => {
    if (res.ok || res.type === "opaque") { const cp = res.clone(); caches.open(VERSION).then(c => c.put(r, cp)); }
    return res;
  })));
});
