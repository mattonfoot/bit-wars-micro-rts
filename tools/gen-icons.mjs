// Renders the app icon (SVG) to the PNG sizes iOS/Android need, using the bundled Chromium.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
// Resolve playwright from the local project or the global npm root.
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); }
catch { const root = execSync('npm root -g').toString().trim(); ({ chromium } = require(root + '/playwright')); }
import { writeFileSync, mkdirSync } from 'node:fs';

const svg = (size, maskable) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <defs><radialGradient id="g" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="#1c2233"/><stop offset="1" stop-color="#07090e"/></radialGradient></defs>
  <rect width="100" height="100" rx="${maskable ? 0 : 22}" fill="url(#g)"/>
  <g stroke="#0b0d12" stroke-width="2.5" stroke-linejoin="round">
    <polygon points="50,14 72,52 28,52" fill="#3d8bff"/>
    <rect x="16" y="54" width="30" height="30" fill="#ff4b3e"/>
    <circle cx="70" cy="69" r="15.5" fill="#3ddc84"/>
  </g>
</svg>`;

const browser = await chromium.launch();
const page = await browser.newPage();
mkdirSync('icons', { recursive: true });
// App Store icon: 1024x1024, opaque, square corners (iOS applies the mask).
mkdirSync('ios/App/App/Assets.xcassets/AppIcon.appiconset', { recursive: true });
mkdirSync('ios/App/App/Assets.xcassets/Splash.imageset', { recursive: true });
const targets = [['icons/icon-192.png', 192, false], ['icons/icon-512.png', 512, false], ['icons/icon-512-maskable.png', 512, true], ['icons/apple-touch-icon.png', 180, true], ['ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', 1024, true]];
for (const [name, size, maskable] of targets) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${svg(size, maskable)}</body></html>`);
  const buf = await page.screenshot({ omitBackground: !maskable, clip: { x: 0, y: 0, width: size, height: size } });
  writeFileSync(name, buf);
  console.log('wrote ' + name);
}
// Launch image: centred logo on the game background (the storyboard scales it for every device).
const splash = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#0b0d12"/>
  <g transform="translate(35 32) scale(0.3)" stroke="#0b0d12" stroke-width="2.5" stroke-linejoin="round">
    <polygon points="50,14 72,52 28,52" fill="#3d8bff"/><rect x="16" y="54" width="30" height="30" fill="#ff4b3e"/><circle cx="70" cy="69" r="15.5" fill="#3ddc84"/>
  </g>
  <text x="50" y="70" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="800" font-size="6" fill="#e8ecf1" letter-spacing="0.6">BIT WARS</text>
</svg>`;
for (const [file, size] of [['splash-2732x2732.png', 2732], ['splash-2732x2732-1.png', 2732], ['splash-2732x2732-2.png', 2732]]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0">${splash(size)}</body></html>`);
  const buf = await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size } });
  writeFileSync(`ios/App/App/Assets.xcassets/Splash.imageset/${file}`, buf);
  console.log('wrote splash ' + file);
}
writeFileSync('icons/icon.svg', svg(512, false));
await browser.close();
