// Runs before the game: restores its saves from the user data folder into localStorage, mirrors every change back to
// that file (Steam Cloud syncs the file), and exposes a small desktop API on window.desktop.
const { contextBridge, ipcRenderer } = require('electron');
const KEY = /^bw_/;

try {
  const saved = ipcRenderer.sendSync('saves:read') || {};
  for (const [k, v] of Object.entries(saved)) if (KEY.test(k) && typeof v === 'string') localStorage.setItem(k, v);
} catch (e) { /* first run or unreadable file: start clean */ }

let last = null;
function snapshot() { const out = {}; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (KEY.test(k)) out[k] = localStorage.getItem(k); } return out; }
function flush() {
  const snap = JSON.stringify(snapshot());
  if (snap === last) return false;
  last = snap; ipcRenderer.sendSync('saves:write', JSON.parse(snap));
  return true;
}
setInterval(flush, 5000);
window.addEventListener('beforeunload', flush);
window.addEventListener('pagehide', flush);

contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform,
  info: () => ipcRenderer.invoke('app:info'),
  toggleFullscreen: () => ipcRenderer.invoke('window:fullscreen'),
  quit: () => ipcRenderer.invoke('app:quit'),
  flushSaves: () => flush(),
  achievement: (name) => ipcRenderer.invoke('steam:achievement', String(name)),
});
