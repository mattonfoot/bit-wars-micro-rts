// Launches the Electron shell under Playwright, checks the game boots with no console errors, that window.desktop is
// exposed, and that saves round-trip through the user data file. Needs a display (use xvfb-run on Linux servers).
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { _electron: electron } = require(execSync('npm root -g').toString().trim() + '/playwright');
const root = path.resolve(new URL('..', import.meta.url).pathname), desk = path.join(root, 'desktop');
execSync('node sync.mjs', { cwd: desk, stdio: 'inherit' });
const userData = mkdtempSync(path.join(tmpdir(), 'bitwars-'));
const errors = [];
const app = await electron.launch({ cwd: desk, args: ['.', `--user-data-dir=${userData}`], executablePath: path.join(desk, 'node_modules', '.bin', 'electron') });
try {
  const page = await app.firstWindow();
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.waitForSelector('.fpick', { timeout: 20000 });
  const info = await page.evaluate(async () => ({ hasDesktop: !!window.desktop, url: location.href, hint: !!document.querySelector('#installHint'), sw: !!navigator.serviceWorker?.controller, info: await window.desktop.info() }));
  console.log('boot', JSON.stringify(info));
  await page.evaluate(() => { localStorage.setItem('bw_settings', JSON.stringify({ faction: 'green', theme: 'frost' })); return window.desktop.flushSaves(); });
  const file = info.info.saves;
  const saved = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null;
  console.log('save file', file, saved ? Object.keys(saved) : 'missing');
  await page.screenshot({ path: path.join(root, 'screenshots', 'desktop.png') }).catch(() => {});
  await app.close();
  // relaunch with the same user data: the preload must restore the saved keys before the game reads them
  const app2 = await electron.launch({ cwd: desk, args: ['.', `--user-data-dir=${userData}`], executablePath: path.join(desk, 'node_modules', '.bin', 'electron') });
  const page2 = await app2.firstWindow();
  await page2.waitForSelector('.fpick', { timeout: 20000 });
  const restored = await page2.evaluate(() => localStorage.getItem('bw_settings'));
  await app2.close();
  console.log('restored on relaunch', restored);
  const ok = info.hasDesktop && info.url.startsWith('app://') && !info.hint && !info.sw && saved && saved.bw_settings && /green/.test(restored || '') && !errors.length;
  console.log(ok ? 'Desktop shell OK' : `Desktop shell FAILED ${errors.join(' | ')}`);
  process.exitCode = ok ? 0 : 1;
} catch (e) { console.log('Desktop shell FAILED', e); process.exitCode = 1; try { await app.close(); } catch (err) { /* already closed */ } }
