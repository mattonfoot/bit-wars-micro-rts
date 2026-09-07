// Dev tool: 40-chapter list with act headers, then play a scavenge, an allied and a migrate chapter in the real UI.
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require(execSync('npm root -g').toString().trim() + '/playwright');
const out = process.argv[2] || 'screenshots';
mkdirSync(out, { recursive: true });
const port = 8771;
const server = spawn('npx', ['http-server', '.', '-p', String(port), '-c-1', '-s'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));
const browser = await chromium.launch();
const errors = [];
let ok = true;
try {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => { errors.push(String(e)); console.log('[pageerror]', e); });
  page.on('console', (m) => { if (m.type() === 'error') { errors.push(m.text()); console.log('[console]', m.text()); } });
  await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem('bw_campaign', JSON.stringify({ blue: 25, red: 15, green: 36 })); });
  await page.reload({ waitUntil: 'load' });
  await page.tap('.fpick[data-f="blue"]'); await page.waitForTimeout(200);
  await page.tap('#btnCampaign'); await page.waitForTimeout(300);
  const counts = await page.evaluate(() => ({ chapters: document.querySelectorAll('.chapter').length, acts: [...document.querySelectorAll('.acthead')].map((a) => a.textContent), next: document.querySelector('.chapter.next b')?.textContent }));
  console.log('list', JSON.stringify(counts));
  ok = ok && counts.chapters === 40 && counts.acts.length === 8;
  await page.screenshot({ path: `${out}/c40-list.png` });
  await page.evaluate(() => document.querySelector('.chapter.next').scrollIntoView({ block: 'center' })); await page.waitForTimeout(200);
  await page.screenshot({ path: `${out}/c40-list-mid.png` });
  await page.tap('.chapter.next'); await page.waitForTimeout(300);
  await page.screenshot({ path: `${out}/c40-briefing.png` });
  const brief = await page.evaluate(() => document.querySelector('#briefing, .briefing')?.textContent.slice(0, 200));
  console.log('briefing', brief);
  await page.tap('#chBegin'); await page.waitForTimeout(2500);
  let st = await page.evaluate(() => { const g = window.game; return { key: g.campaign.def.key, style: g.campaign.def.style, players: g.world.players.map((p) => `${p.name}:${p.faction}:t${p.team}${p.neutral ? ':N' : ''}`), ais: g.ais.length, objectives: g.campaign.list().map((o) => `${o.text}:${o.cur}/${o.target}`) }; });
  console.log('playing', JSON.stringify(st));
  ok = ok && st.key === 'blue-26' && st.style === 'alliedAssault' && st.ais === 2;
  await page.evaluate(() => { const g = window.game; g.camera.zoomAt(0.5, 422, 195); });
  await page.waitForTimeout(6000);
  await page.screenshot({ path: `${out}/c40-allied.png` });
  // jump straight into a scavenge chapter (grey neutrals) and a migrate chapter (doom warning)
  for (const [key, shot, secs] of [['blue-22', 'c40-scavenge', 4000], ['green-37', 'c40-migrate', 3000], ['red-29', 'c40-betrayal', 3000]]) {
    await page.evaluate((k) => { window.game.clearSave(); window.game.startChapter(k); }, key);
    await page.waitForTimeout(500);
    await page.evaluate(() => { const g = window.game; g.camera.zoomAt(0.6, 422, 195); });
    await page.waitForTimeout(secs);
    st = await page.evaluate(() => { const g = window.game; const w = g.world; return { key: g.campaign.def.key, style: g.campaign.def.style, players: w.players.map((p) => `${p.name}:${p.faction}:t${p.team}${p.neutral ? ':N' : ''}`), ais: g.ais.length, squads: w.squads.filter((s) => !s.dead).length, status: g.campaign.status, objectives: g.campaign.list().map((o) => `${o.text}:${o.cur}/${o.target}`) }; });
    console.log(key, JSON.stringify(st));
    ok = ok && st.key === key && st.status === 'playing';
    await page.screenshot({ path: `${out}/${shot}.png` });
  }
  // pause + resume through a save on a chapter with neutrals and allies
  await page.evaluate(() => { window.game.clearSave(); window.game.startChapter('green-22'); });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.game.save());
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('bw_save')).world.players.map((p) => `${p.faction}:t${p.team}${p.neutral ? ':N' : ''}`));
  console.log('saved players', JSON.stringify(saved));
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(500);
  const hasResume = await page.$('#btnResume');
  if (hasResume) { await page.tap('#btnResume'); await page.waitForTimeout(1500); }
  const res = await page.evaluate(() => { const g = window.game; return { key: g.campaign?.def.key, players: g.world?.players.map((p) => `${p.faction}:t${p.team}${p.neutral ? ':N' : ''}`), ais: g.ais?.length, neutralIds: g.campaign?.neutralIds }; });
  console.log('resumed', JSON.stringify(res));
  ok = ok && res.key === 'green-22' && !!res.neutralIds && Object.keys(res.neutralIds).length === 1;
  await page.screenshot({ path: `${out}/c40-resumed.png` });
} finally { await browser.close(); server.kill(); }
console.log(ok && !errors.length ? 'Chapter UI OK' : 'Chapter UI FAILED');
process.exit(ok && !errors.length ? 0 : 1);
