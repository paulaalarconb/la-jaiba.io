// Guarda el juego para jugar sin conexión.
const CACHE = "jaiba-cap1-v1";
const FILES = ["./", "index.html", "style.css", "game.js", "manifest.webmanifest", "icon-192.png", "icon-512.png",
  "assets/casa.png", "assets/javiera_adolescente.png", "assets/npc_perro.png", "assets/npc_nieta.png",
  "assets/item_trompo.png", "assets/item_soldadito.png", "assets/item_honda.png", "assets/item_llave.png", "assets/item_nota.png"];
self.addEventListener("install", e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())));
self.addEventListener("activate", e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok || res.type === "opaque") { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)) }
    return res;
  }).catch(() => hit)));
});
