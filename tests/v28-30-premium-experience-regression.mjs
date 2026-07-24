import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const layout = read('src/app/layout.tsx');
const globals = read('src/app/globals.css');
const css = read('src/app/design-system-v2830-experience.css');
const layer = read('src/components/PremiumExperienceLayer.tsx');
const experience = read('src/lib/premiumExperience.ts');
const app = read('src/components/CardVisionApp.tsx');
const auth = read('src/components/AuthGate.tsx');
const loading = read('src/components/PanelLoadingFallback.tsx');
const error = read('src/app/error.tsx');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const sw = read('public/sw.js');

assert.equal(pkg.version, '29.10.0');
assert.equal(lock.version, '29.10.0');
assert.equal(lock.packages[''].version, '29.10.0');
assert.match(pkg.scripts['test:all'], /^(?:npm run test:v2910 && )?(?:npm run test:v2900 && )?(?:npm run test:v2880 && )?(?:npm run test:v2870 && )?npm run test:v2860 && npm run test:v2850 && npm run test:v2840 && npm run test:v2830 && npm run test:v2820 && npm run test:v2810 && npm run test:v2800/);
assert.match(pkg.scripts['test:v2830'], /v28-30-premium-experience-regression\.mjs/);
assert.equal(manifest.name, 'BuildMaster Elite Tático v29.10');
assert.match(sw, /buildmaster-v29-10/);

assert.match(globals, /design-system-v2830-experience\.css/);
assert.match(layout, /PremiumExperienceLayer/);
assert.match(layout, /bm-v2830-experience/);
assert.match(layer, /buildmaster:toast/);
assert.match(layer, /buildmaster:busy/);
assert.match(layer, /buildmaster:screen-change/);
assert.match(layer, /buildmaster:celebrate/);
assert.match(layer, /navigator\.vibrate/);
assert.match(layer, /bm-toast-viewport/);
assert.match(experience, /showPremiumToast/);
assert.match(experience, /setPremiumBusy/);
assert.match(experience, /announcePremiumScreen/);
assert.match(experience, /celebratePremiumAction/);

assert.match(css, /bm-premium-ripple/);
assert.match(css, /bm-premium-progress/);
assert.match(css, /bm-premium-toast/);
assert.match(css, /bm-screen-enter/);
assert.match(css, /bm-skeleton-shimmer/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /bm-recovery-screen/);
assert.match(css, /safe-area-inset-bottom/);

assert.match(app, /announcePremiumScreen/);
assert.match(app, /setPremiumBusy/);
assert.match(app, /showPremiumToast/);
assert.match(app, /celebratePremiumAction/);
assert.match(auth, /Validando licença e aparelho/);
assert.match(auth, /Acesso autorizado/);
assert.match(loading, /aria-busy="true"/);
assert.match(error, /bm-recovery-card/);

// Blocos anteriores precisam continuar presentes.
assert.ok(fs.existsSync('src/app/design-system-v2800-identity.css'));
assert.ok(fs.existsSync('src/app/design-system-v2810-navigation.css'));
assert.ok(fs.existsSync('src/app/design-system-v2820-screens.css'));
assert.match(layout, /bm-v28-identity/);
assert.match(layout, /bm-v2820-screens/);

console.log('v28.30 premium experience regression: ok');
