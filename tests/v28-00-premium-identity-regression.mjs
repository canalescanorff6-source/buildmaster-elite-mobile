import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const globals = read('src/app/globals.css');
const identity = read('src/app/design-system-v2800-identity.css');
const layout = read('src/app/layout.tsx');
const auth = read('src/components/AuthGate.tsx');
const app = read('src/components/CardVisionApp.tsx');
const nav = read('src/components/RefinedNavigation.tsx');
const brand = read('src/components/PremiumBrand.tsx');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const sw = read('public/sw.js');

assert.equal(pkg.version, '29.10.0');
assert.equal(lock.version, '29.10.0');
assert.equal(lock.packages[''].version, '29.10.0');
assert.match(pkg.scripts['test:all'], /^(?:npm run test:v2910 && )?(?:npm run test:v2900 && )?(?:npm run test:v2880 && )?(?:npm run test:v2870 && )?npm run test:v2860 && npm run test:v2850 && npm run test:v2840 && npm run test:v2830 && npm run test:v2820 && npm run test:v2810 && npm run test:v2800 && npm run test:v2740/);
assert.match(pkg.scripts['test:v2800'], /v28-00-premium-identity-regression\.mjs/);
assert.match(globals, /@import "\.\/design-system-v2800-identity\.css";/);
assert.match(globals, /@import "\.\/design-system-v2810-navigation\.css";/);
assert.match(globals.trim(), /@import "\.\/design-system-v2910-admin-update\.css";$/);
assert.match(layout, /className="[^"]*bm-v28-identity[^"]*"/);
assert.match(layout, /themeColor: '#0b1931'/);
assert.match(identity, /Obsidian Pearl/);
assert.match(identity, /--bm28-ink-950:#071225/);
assert.match(identity, /--bm28-champagne-500:#c99a4a/);
assert.match(identity, /\.auth-submit/);
assert.match(identity, /\.refined-primary-nav/);
assert.match(identity, /\.bm-premium-brand/);
assert.match(brand, /BuildMaster/);
assert.match(brand, /Elite Tático/);
assert.match(brand, />PRO</);
assert.match(auth, /<PremiumBrand variant="hero" showVersion/);
assert.match(auth, /<PremiumBrand variant="standard"/);
assert.match(app, /<PremiumBrand variant="hero" showVersion/);
assert.match(app, /<PremiumBrand variant="compact" showVersion/);
assert.match(nav, /<PremiumBrand variant="compact"/);
assert.equal(manifest.name, 'BuildMaster Elite Tático v29.10');
assert.equal(manifest.short_name, 'BuildMaster v29.10');
assert.equal(manifest.background_color, '#f5f1e9');
assert.equal(manifest.theme_color, '#0b1931');
assert.match(sw, /buildmaster-v29-10/);

for (const file of ['public/icons/icon-192.png','public/icons/icon-512.png','public/icons/icon-maskable-192.png','public/icons/icon-maskable-512.png']) {
  const buffer = fs.readFileSync(path.join(root,file));
  assert.equal(buffer.toString('hex',0,8),'89504e470d0a1a0a',`${file} precisa ser PNG válido`);
  const expected = file.includes('192') ? 192 : 512;
  assert.equal(buffer.readUInt32BE(16),expected,`${file} largura incorreta`);
  assert.equal(buffer.readUInt32BE(20),expected,`${file} altura incorreta`);
}

console.log('v28.10 premium identity regression: ok');
