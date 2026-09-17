// Copies the web build into desktop/app so the shell and the installers carry the same files the PWA and iOS app use.
import { execSync } from 'node:child_process';
import { cpSync, rmSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, '..');
execSync('node tools/build-www.mjs', { cwd: root, stdio: 'inherit' });
const out = path.join(here, 'app');
rmSync(out, { recursive: true, force: true });
cpSync(path.join(root, 'www'), out, { recursive: true });
if (existsSync(path.join(out, 'sw.js'))) rmSync(path.join(out, 'sw.js')); // the shell serves files directly; no service worker cache to go stale
console.log('desktop/app synced');
