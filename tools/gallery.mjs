// Dev tool: screenshots of every theme (fog off, zoomed out), each faction's roster, and overlays.
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const out = process.argv[2] || 'screenshots';
mkdirSync(out, { recursive: true });
const port = 8767;
const server = spawn('npx', ['http-server', '.', '-p', String(port), '-c-1', '-s'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));
const browser = await chromium.launch();
const errors = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { errors.push(String(e)); console.log('[pageerror]', e); });
  page.on('console', (m) => { if (m.type() === 'error') { errors.push(m.text()); console.log('[console]', m.text()); } });
  await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
  const themes = ['ashfall', 'frost', 'crystal', 'urban', 'verdant'];
  const factions = ['green', 'blue', 'red', 'green', 'blue'];
  for (let i = 0; i < themes.length; i++) {
    await page.evaluate(([t, f]) => { const g = window.game; g.menu.hide(); g.start({ faction: f, theme: t, difficulty: 'normal', size: 64, seed: 'gallery' }); g.renderer.showFog = false; g.camera.zoom = g.camera.minZoom; g.camera.centerOn(g.world.grid.cx, g.world.grid.cy); g.select([]); }, [themes[i], factions[i]]);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/theme-${themes[i]}.png` });
    if (i < 3) {
      // roster close-up near HQ
      await page.evaluate(() => {
        const g = window.game, w = g.world, T = 32; const hq = w.byId(w.players[0].hqId);
        const units = Object.keys(w.faction(0).units);
        units.forEach((k, j) => w.spawnSquad(0, k, hq.x + 3 * T + (j % 3) * 4 * T, hq.y - T + Math.floor(j / 3) * 3.5 * T));
        const B = Object.values(w.faction(0).buildings).filter((b) => !b.hq);
        for (const b of B) { for (const c of w.grid.cluster(hq.cell, 7)) { const r = w.cmdBuild(0, b.key, c); if (r.ok) { r.building.done = true; r.building.progress = 1; r.building.hp = r.building.maxHp; break; } } }
        g.camera.zoom = 1.3; g.camera.centerOn(hq.x + 4 * T, hq.y + T);
        g.select([w.squads[0].id]);
      });
      await page.waitForTimeout(700);
      await page.screenshot({ path: `${out}/roster-${factions[i]}.png` });
    }
  }
  await page.evaluate(() => window.game.openPause());
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/overlay-pause.png` });
  await page.evaluate(() => { const g = window.game; g.menu.hidePause(); g.paused = false; g.menu.showGameOver({ won: true, time: 754, me: g.world.players[0].stats, enemy: g.world.players[1].stats, handlers: { restart() {}, quit() {} } }); });
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/overlay-gameover.png` });
} finally { await browser.close(); server.kill(); }
console.log(errors.length ? `ERRORS ${errors.length}` : 'No console errors');
