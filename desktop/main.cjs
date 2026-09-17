// Electron main process: serves the game over a private app:// scheme, keeps saves in the user data folder, and
// wires window, menu and Steam hooks. The game itself is untouched web code from ../www.
const { app, BrowserWindow, protocol, net, Menu, ipcMain, shell } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const { pathToFileURL } = require('node:url');
const steam = require('./steam.cjs');

const APP_DIR = path.join(__dirname, 'app');
const DEV = !app.isPackaged && !!process.env.BITWARS_DEV;
const isMac = process.platform === 'darwin';
let win = null;

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true, corsEnabled: true } }]);
steam.init(); // before ready: the Steam overlay needs its switches set early; a no-op without an app id

// ---- saves: one JSON file mirrors the game's localStorage keys; point Steam Cloud auto-config at this folder
const saveFile = () => path.join(app.getPath('userData'), 'saves', 'bitwars.json');
function readSaves() { try { return JSON.parse(fs.readFileSync(saveFile(), 'utf8')); } catch (e) { return {}; } }
function writeSaves(data) {
  const f = saveFile(); fs.mkdirSync(path.dirname(f), { recursive: true });
  const tmp = `${f}.tmp`; fs.writeFileSync(tmp, JSON.stringify(data)); fs.renameSync(tmp, f);
}

function serveApp(req) {
  const u = new URL(req.url);
  let p = decodeURIComponent(u.pathname);
  if (p === '/' || p === '') p = '/index.html';
  const file = path.normalize(path.join(APP_DIR, p));
  if (!file.startsWith(APP_DIR)) return new Response('forbidden', { status: 403 });
  return net.fetch(pathToFileURL(file).toString());
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 900, minHeight: 540, backgroundColor: '#0b0d12', title: 'Bit Wars', show: false,
    autoHideMenuBar: !isMac, fullscreenable: true,
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false },
  });
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('app://')) e.preventDefault(); });
  win.on('closed', () => { win = null; });
  win.loadURL('app://game/index.html');
}

function buildMenu() {
  const toggleFull = { label: 'Toggle Full Screen', accelerator: isMac ? 'Ctrl+Cmd+F' : 'F11', click: () => { if (win) win.setFullScreen(!win.isFullScreen()); } };
  const template = [
    ...(isMac ? [{ label: app.name, submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' }, { role: 'quit' }] }] : []),
    { label: 'View', submenu: [toggleFull, ...(DEV ? [{ type: 'separator' }, { role: 'reload' }, { role: 'toggleDevTools' }] : [])] },
    { label: 'Window', submenu: [{ role: 'minimize' }, { role: 'zoom' }, ...(isMac ? [{ type: 'separator' }, { role: 'front' }] : [{ role: 'close' }])] },
    ...(isMac ? [] : [{ label: 'Game', submenu: [{ role: 'quit' }] }]),
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  protocol.handle('app', serveApp);
  ipcMain.on('saves:read', (e) => { e.returnValue = readSaves(); });
  ipcMain.on('saves:write', (e, data) => { try { writeSaves(data && typeof data === 'object' ? data : {}); } catch (err) { console.warn('[saves] write failed:', err.message); } e.returnValue = true; });
  ipcMain.handle('window:fullscreen', () => { if (!win) return false; win.setFullScreen(!win.isFullScreen()); return win.isFullScreen(); });
  ipcMain.handle('app:quit', () => app.quit());
  ipcMain.handle('app:info', () => ({ platform: process.platform, version: app.getVersion(), steam: steam.available(), player: steam.playerName(), saves: saveFile() }));
  ipcMain.handle('steam:achievement', (e, name) => steam.unlock(name));
  buildMenu();
  createWindow();
  app.on('activate', () => { if (!win) createWindow(); });
});
app.on('window-all-closed', () => { if (!isMac) app.quit(); });
