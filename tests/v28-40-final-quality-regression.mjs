import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const globals = read('src/app/globals.css');
const layout = read('src/app/layout.tsx');
const css = read('src/app/design-system-v2840-quality.css');
const layer = read('src/components/PremiumQualityLayer.tsx');
const center = read('src/components/PremiumQualityCenter.tsx');
const quality = read('src/lib/appQualityV2840.ts');
const app = read('src/components/CardVisionApp.tsx');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const sw = read('public/sw.js');

assert.equal(pkg.version, '29.10.0');
assert.equal(lock.version, '29.10.0');
assert.equal(lock.packages[''].version, '29.10.0');
assert.match(pkg.scripts['test:all'], /^(?:npm run test:v2910 && )?(?:npm run test:v2900 && )?(?:npm run test:v2880 && )?(?:npm run test:v2870 && )?npm run test:v2860 && npm run test:v2850 && npm run test:v2840 && npm run test:v2830 && npm run test:v2820/);
assert.match(pkg.scripts['test:v2840'], /v28-40-final-quality-regression\.mjs/);
assert.equal(manifest.name, 'BuildMaster Elite Tático v29.10');
assert.match(sw, /buildmaster-v29-10/);

assert.match(globals.trim(), /design-system-v2910-admin-update\.css";$/);
assert.match(layout, /PremiumQualityLayer/);
assert.match(layout, /bm-v2840-quality/);
assert.match(app, /PremiumQualityCenter/);
assert.match(app, /qualidade-final/);
assert.match(layer, /buildmaster:quality-preference/);
assert.match(layer, /unhandledrejection/);
assert.match(layer, /PerformanceObserver/);
assert.match(layer, /bm-back-to-top/);
assert.match(center, /auditVisibleInterface/);
assert.match(center, /Perfil visual e de desempenho/);
assert.match(center, /Exportar relatório/);
assert.match(quality, /detectDeviceQualityProfile/);
assert.match(quality, /recordRuntimeQualityIssue/);
assert.match(quality, /createQualityReport/);
assert.match(quality, /qualityScore/);

for (const selector of [
  '.bm2840-quality-center',
  '.bm2840-quality-mode',
  '.bm-back-to-top',
  '[data-quality-profile="economy"]',
  '@media (forced-colors: active)',
  '@media print'
]) assert.ok(css.includes(selector), `seletor ou regra ausente: ${selector}`);
assert.match(css, /min-block-size:\s*44px/);
assert.match(css, /:focus-visible/);
assert.match(css, /prefers-reduced-motion/);

// Blocos anteriores permanecem ativos.
for (const file of [
  'src/app/design-system-v2800-identity.css',
  'src/app/design-system-v2810-navigation.css',
  'src/app/design-system-v2820-screens.css',
  'src/app/design-system-v2830-experience.css'
]) assert.ok(fs.existsSync(file), `${file} ausente`);

console.log('v28.40 final quality regression: ok');
