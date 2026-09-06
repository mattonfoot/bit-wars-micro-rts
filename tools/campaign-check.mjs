// Dev tool: drive the campaign UI (menu -> chapter briefing -> play -> objectives -> chapter end) and screenshot.
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const out = process.argv[2] || 'screenshots';
mkdirSync(out, { recursive: true });
const port = 8769;
const server = spawn('npx', ['http-server', '.', '-p', String(port), '-c-1', '-s'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));
const browser = await chromium.launch();
const errors = [];
let ok = false;
try {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { errors.push(String(e)); console.log('[pageerror]', e); });
  page.on('console', (m) => { if (m.type() === 'error') { errors.push(m.text()); console.log('[console]', m.text()); } });
  await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload({ waitUntil: 'load' });
  await page.click('.tab[data-tab="campaign"]');
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/camp-menu.png` });
  await page.click('.chapter.next');
  await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/camp-briefing.png` });
  await page.click('#chBegin');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/camp-play.png` });
  // complete stage 1 via the UI: HQ is selected; tap Dart Swarm twice
  await page.evaluate(() => { const b = [...document.querySelectorAll('#cmd button')].find((x) => x.textContent.includes('Dart')); b.click(); b.click(); });
  await page.waitForTimeout(500);
  const st = await page.evaluate(() => ({ queue: window.game.world.byId(window.game.world.players[0].hqId).queue, objectives: window.game.campaign.list().map((o) => `${o.text}:${o.cur}/${o.target}`) }));
  console.log('after taps', JSON.stringify(st));
  // fast-forward the sim to finish stage 1
  await page.evaluate(() => { const g = window.game; for (let i = 0; i < 60 * 30; i++) { g.world.tick(1 / 60); g.campaign.onEvents(g.world.events); g.campaign.update(1 / 60); g.world.events.length = 0; } });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/camp-stage2.png` });
  const st2 = await page.evaluate(() => ({ stage: window.game.campaign.stage, msgs: document.querySelectorAll('#toasts .toast').length }));
  console.log('stage now', JSON.stringify(st2));
  // force a win and check the chapter-end screen + progress
  await page.evaluate(() => { window.game.campaign.status = 'won'; });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${out}/camp-end.png` });
  const prog = await page.evaluate(() => localStorage.getItem('bw_campaign'));
  console.log('progress', prog);
  const hasNext = await page.$('#ceNext');
  ok = st2.stage === 1 && !!hasNext && prog.includes('"blue":1');
  await page.click('#ceNext');
  await page.waitForTimeout(1500);
  const ch2 = await page.evaluate(() => window.game.campaign.def.key);
  console.log('next chapter', ch2);
  ok = ok && ch2 === 'blue-2';
} finally { await browser.close(); server.kill(); }
console.log(ok && !errors.length ? 'Campaign flow OK' : 'Campaign flow FAILED');
process.exit(ok && !errors.length ? 0 : 1);
