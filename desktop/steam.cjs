// Steamworks bridge. Dormant until two things exist: the steamworks.js package (npm i steamworks.js in this folder)
// and an app id, from STEAM_APP_ID or a steam_appid.txt beside the executable. Without them every call is a no-op,
// so the direct-download build and the Steam build share one code path.
const fs = require('node:fs');
const path = require('node:path');
let client = null;

function readAppId() {
  if (process.env.STEAM_APP_ID) return +process.env.STEAM_APP_ID;
  for (const dir of [process.resourcesPath || '', process.cwd(), __dirname]) {
    try { const t = fs.readFileSync(path.join(dir, 'steam_appid.txt'), 'utf8').trim(); if (t) return +t; } catch (e) { /* not here */ }
  }
  return 0;
}
/** Call before app.whenReady: the overlay needs command-line switches set early. */
function init() {
  const id = readAppId();
  if (!id) return false;
  try {
    const sw = require('steamworks.js');
    sw.electronEnableSteamOverlay?.();
    client = sw.init(id);
    return true;
  } catch (e) {
    client = null;
    console.warn('[steam] not available:', e.message);
    return false;
  }
}
const available = () => !!client;
/** Unlock an achievement by its API name; returns false when Steam is not running. */
function unlock(name) {
  if (!client) return false;
  try { if (!client.achievement.isActivated(name)) client.achievement.activate(name); return true; } catch (e) { return false; }
}
function playerName() { try { return client ? client.localplayer.getName() : ''; } catch (e) { return ''; } }
module.exports = { init, available, unlock, playerName };
