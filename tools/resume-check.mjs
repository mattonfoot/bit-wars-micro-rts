// Dev tool: start a battle, reload the page mid-game, resume from the menu, verify state and no errors.
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const port = 8768;
const server = spawn('npx', ['http-server', '.', '-p', String(port), '-c-1', '-s'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));
const browser = await chromium.launch();
const errors = [];
let ok = false;
try {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { errors.push(String(e)); console.log('[pageerror]', e); });
  page.on('console', (m) => { if (m.type() === 'error') { errors.push(m.text()); console.log('[console]', m.text()); } });
  await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
  await page.click('#btnStart');
  await page.evaluate(() => { const g = window.game, w = g.world; const hq = w.byId(w.players[0].hqId); w.cmdTrain(hq, Object.keys(w.faction(0).units)[0]); });
  await page.waitForTimeout(9000); // > autosave interval
  const before = await page.evaluate(() => ({ time: window.game.world.time, seed: window.game.map.seed, squads: window.game.world.squads.length, saved: !!localStorage.getItem('bw_save') }));
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);
  const hasResume = await page.$('#btnResume');
  if (!hasResume) throw new Error('no resume button after reload');
  await page.click('#btnResume');
  await page.waitForTimeout(1500);
  const after = await page.evaluate(() => ({ time: window.game.world.time, seed: window.game.map.seed, squads: window.game.world.squads.length, running: window.game.running }));
  console.log('before', JSON.stringify(before), 'after', JSON.stringify(after));
  ok = before.saved && after.running && after.seed === before.seed && after.time >= before.time - 9 && after.time > 1;
} finally { await browser.close(); server.kill(); }
console.log(ok && !errors.length ? 'Resume flow OK' : 'Resume flow FAILED');
process.exit(ok && !errors.length ? 0 : 1);
