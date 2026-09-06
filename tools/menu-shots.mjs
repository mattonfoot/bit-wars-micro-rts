// Dev tool: screenshots of the menu flow (title, faction carousel, chapters, skirmish, briefing) in landscape and portrait.
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const out = process.argv[2] || 'screenshots';
mkdirSync(out, { recursive: true });
const port = 8773;
const server = spawn('npx', ['http-server', '.', '-p', String(port), '-c-1', '-s'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));
const browser = await chromium.launch();
const errors = [];
try {
  for (const [name, vp] of [['land', { width: 812, height: 375 }], ['port', { width: 375, height: 812 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => { errors.push(String(e)); console.log('[pageerror]', e); });
    page.on('console', (m) => { if (m.type() === 'error') { errors.push(m.text()); console.log('[console]', m.text()); } });
    await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const scrollable = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 2 || document.getElementById('menu').scrollHeight > window.innerHeight + 2);
    console.log(name, 'title page scrolls:', scrollable);
    await page.screenshot({ path: `${out}/menu-${name}-1-title.png` });
    await page.tap('.fpick[data-f="red"]'); await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/menu-${name}-2-faction.png` });
    await page.tap('#btnNext'); await page.waitForTimeout(200);
    const f = await page.evaluate(() => window.game.menu.settings.faction);
    console.log(name, 'after next arrow:', f);
    await page.tap('#btnCampaign'); await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/menu-${name}-3-campaign.png` });
    await page.tap('.chapter.next'); await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/menu-${name}-4-briefing.png` });
    await page.tap('#chBack'); await page.tap('#btnBack'); await page.tap('#btnSkirmish'); await page.waitForTimeout(200);
    await page.screenshot({ path: `${out}/menu-${name}-5-skirmish.png` });
    await ctx.close();
  }
} finally { await browser.close(); server.kill(); }
console.log(errors.length ? `ERRORS ${errors.length}` : 'No console errors');
process.exit(errors.length ? 1 : 0);
