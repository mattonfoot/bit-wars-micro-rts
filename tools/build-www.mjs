// Assembles the web bundle for native builds into ./www (only the runtime files, nothing else).
import { cpSync, rmSync, mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';
const out = 'www';
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const f of ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'src', 'icons']) {
  if (existsSync(f)) cpSync(f, `${out}/${f}`, { recursive: true });
}
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
writeFileSync(`${out}/version.json`, JSON.stringify({ version: pkg.version, built: new Date().toISOString() }));
console.log(`built ${out}/ (v${pkg.version})`);
