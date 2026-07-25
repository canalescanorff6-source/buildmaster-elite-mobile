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

assert.equal(pkg.version, '30.00.0');
assert.equal(lock.version, '30.00.0');
assert.equal(lock.packages[''].version, '30.00.0');
assert.ok(pkg.scripts['test:all'].startsWith('npm run test:v3000 && npm run test:v2980 && npm run test:v2970 && npm run test:v2960 && npm run test:v2950 && npm run test:v2940 && npm run test:v2930') && pkg.scripts['test:all'].includes('npm run test:v2840'));
assert.match(pkg.scripts['test:v2840'], /v28-40-final-quality-regression\.mjs/);
assert.equal(manifest.name, 'BuildMaster Elite Tático v30.00');
assert.match(sw, /buildmaster-v30-00/);

assert.match(globals.trim(), /design-system-v3000-play-publication\.css";$/);
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
