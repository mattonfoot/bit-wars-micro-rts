// Dev tool: scripted battle in the browser to eyeball combat visuals + touch interaction. Writes screenshots.
import { createRequire } from 'node:module';
import { execSync, spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require(execSync('npm root -g').toString().trim() + '/playwright')); }
const out = process.argv[2] || 'screenshots';
mkdirSync(out, { recursive: true });
const port = 8766;
const server = spawn('npx', ['http-server', '.', '-p', String(port), '-c-1', '-s'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 1500));
const browser = await chromium.launch();
const errors = [];
try {
  for (const [name, vp] of [['land', { width: 844, height: 390 }], ['port', { width: 390, height: 844 }]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 2, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    page.on('console', (m) => { if (m.type() === 'error') { errors.push(m.text()); console.log('[console]', m.text()); } });
    page.on('pageerror', (e) => { errors.push(String(e)); console.log('[pageerror]', e); });
    await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load' });
    await page.evaluate(() => { const s = window.game.menu.settings; s.faction = 'red'; s.theme = 'urban'; s.seed = 'combat'; s.difficulty = 'normal'; });
    await page.click('.fpick[data-f="red"]'); await page.click('#btnSkirmish'); await page.click('#btnStart');
    await page.waitForTimeout(500);
    // Stage a fight near the player's HQ: our squads vs enemy squads, with walls between.
    await page.evaluate(() => {
      const g = window.game, w = g.world, T = 32;
      const hq = w.byId(w.players[0].hqId);
      const bx = hq.x + 8 * T, by = hq.y + 2 * T;
      w.spawnSquad(0, 'bolts', bx, by); w.spawnSquad(0, 'hammers', bx - T, by + 2 * T); w.spawnSquad(0, 'breachers', bx + T, by + 3 * T); w.spawnSquad(0, 'crusher', bx - 2 * T, by - T);
      const ex = bx + 7 * T, ey = by + T;
      const ef = w.players[1].faction; const keys = Object.keys(w.faction(1).units).filter((k) => !w.faction(1).units[k].hero).slice(0, 3);
      for (let i = 0; i < 3; i++) w.spawnSquad(1, keys[i], ex + i * T * 0.5, ey + (i - 1) * 2 * T);
      // a wall line between them
      for (let dy = -3; dy <= 3; dy++) { if (dy === 0) continue; const i = w.grid.cellAt(bx + 4 * T, ey + dy * w.grid.V); if (i >= 0 && !w.blocked[i]) { w.map.tiles[i] = 7; w.map.hp[i] = 260; w.dirtyTiles.push(i); } }
      w.updateVision(true);
      g.camera.zoom = 1.6; g.camera.centerOn(bx + 3 * T, by + T);
      g.selectAllArmy();
      w.cmdAttackMove(g.selectedSquads(), ex, ey);
      for (const s of w.playerSquads(1)) w.cmdAttackMove([s], bx, by);
    });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${out}/combat-${name}-1.png` });
    await page.waitForTimeout(3500);
    await page.screenshot({ path: `${out}/combat-${name}-2.png` });
    // touch interaction: tap a squad in the squad bar, then tap the ground
    const chip = await page.$('#squadbar .sq:not(.all)');
    if (chip) { await chip.tap(); await page.waitForTimeout(200); }
    await page.touchscreen.tap(vp.width * 0.5, vp.height * 0.5);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${out}/combat-${name}-3.png` });
    const st = await page.evaluate(() => { const g = window.game, w = g.world; return { sel: [...g.selection], squads: w.squads.map((s) => `${s.owner}:${s.key}:${s.members.length}:${s.morale | 0}${s.broken ? 'B' : ''}:${s.order.type}`) }; });
    console.log(name, JSON.stringify(st));
    await ctx.close();
  }
} finally { await browser.close(); server.kill(); }
console.log(errors.length ? `ERRORS ${errors.length}` : 'No console errors');
process.exit(errors.length ? 1 : 0);
