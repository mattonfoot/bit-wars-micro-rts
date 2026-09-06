// Dev tool: launch the app in headless Chromium at an iPhone-sized viewport, play a bit, capture screenshots + console errors.
// usage: node tools/screenshot.mjs [outDir] [seconds]
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }

const out = process.argv[2] || 'screenshots';
const seconds = +(process.argv[3] || 20);
mkdirSync(out, { recursive: true });
const port = 8765;
const server = spawn('npx', ['http-server', '.', '-p', String(port), '-c-1', '-s'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));
const browser = await chromium.launch();
const errors = [];
try {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') { errors.push(m.text()); console.log('[console]', m.type(), m.text()); } });
  page.on('pageerror', (e) => { errors.push(String(e)); console.log('[pageerror]', e); });
  await page.goto(`http://localhost:${port}/index.html?seed=test`, { waitUntil: 'load' });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/01-menu.png` });
  await page.evaluate(() => { const s = window.game.menu.settings; s.faction = 'blue'; s.theme = 'verdant'; s.seed = 'shot1'; });
  await page.click('.tab[data-tab="skirmish"]'); await page.click('#btnStart');
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/02-start.png` });
  // queue units + build an extractor via API, then let the game run
  await page.evaluate(() => {
    const g = window.game, w = g.world;
    const hq = w.byId(w.players[0].hqId);
    w.cmdTrain(hq, 'darts'); w.cmdTrain(hq, 'needles');
    const o = w.ore.slice().sort((a, b) => Math.hypot(a.x - hq.x, a.y - hq.y) - Math.hypot(b.x - hq.x, b.y - hq.y))[0];
    console.log('build', JSON.stringify(w.cmdBuild(0, 'lode', o.cell)));
  });
  await page.waitForTimeout(seconds * 1000 * 0.5);
  await page.screenshot({ path: `${out}/03-mid.png` });
  // select all and attack-move toward the map centre; zoom out
  await page.evaluate(() => {
    const g = window.game, w = g.world;
    g.selectAllArmy();
    const cx = w.grid.cx, cy = w.grid.cy;
    w.cmdAttackMove(g.selectedSquads(), cx, cy);
    g.camera.zoomAt(0.6, 422, 195);
  });
  await page.waitForTimeout(seconds * 1000 * 0.5);
  await page.screenshot({ path: `${out}/04-army.png` });
  // press the real Build button (nothing selected) and check the structure list renders
  await page.evaluate(() => window.game.select([]));
  await page.waitForTimeout(250);
  const buildBtn = await page.$('#cmd button:has-text("Build")');
  if (!buildBtn) throw new Error('Build button missing');
  await buildBtn.tap(); await page.waitForTimeout(300);
  const nBuild = await page.evaluate(() => document.querySelectorAll('#cmd button').length);
  if (nBuild < 3) throw new Error('build list did not render: ' + nBuild);
  await page.evaluate(() => { window.game.startBuild('nest'); const hq = window.game.world.byId(window.game.world.players[0].hqId); window.game.placeGhost(hq.x + 140, hq.y + 40, false); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/05-build.png` });
  const state = await page.evaluate(() => { const w = window.game.world; return { time: w.time, squads: w.squads.length, buildings: w.buildings.length, ore: w.players[0].ore | 0, pop: w.players.map((p) => p.pop) }; });
  console.log('state', JSON.stringify(state));
  // fps sample
  const fps = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(n / 2); }; requestAnimationFrame(f); }));
  console.log('fps ~', fps);
} finally {
  await browser.close();
  server.kill();
}
console.log(errors.length ? `ERRORS: ${errors.length}` : 'No console errors');
process.exit(errors.length ? 1 : 0);
