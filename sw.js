// Service worker: precache the app shell so the installed app works offline.
const VERSION = 'bitwars-v2';
const ASSETS = [
  './', './index.html', './css/style.css', './manifest.webmanifest',
  './src/main.js', './src/engine/rng.js', './src/engine/math.js', './src/engine/camera.js', './src/engine/input.js', './src/engine/audio.js',
  './src/game/data.js', './src/game/world.js', './src/game/combat.js', './src/game/pathfinding.js', './src/game/ai.js', './src/game/campaign.js', './src/game/campaigns.js',
  './src/map/terrain.js', './src/map/themes.js', './src/map/generator.js',
  './src/render/renderer.js', './src/render/terrain.js', './src/render/fog.js', './src/render/shapes.js',
  './src/ui/hud.js', './src/ui/minimap.js', './src/ui/menu.js',
  './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      const net = fetch(e.request).then((res) => {
        if (res && res.ok && new URL(e.request.url).origin === location.origin) caches.open(VERSION).then((c) => c.put(e.request, res.clone()));
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
