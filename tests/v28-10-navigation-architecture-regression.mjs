import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const app = read('src/components/CardVisionApp.tsx');
const navigation = read('src/components/RefinedNavigation.tsx');
const context = read('src/components/PremiumContextBar.tsx');
const home = read('src/modules/core/IntegratedHomePanel.tsx');
const refinement = read('src/lib/appRefinement.ts');
const globals = read('src/app/globals.css');
const css = read('src/app/design-system-v2810-navigation.css');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const sw = read('public/sw.js');

assert.equal(pkg.version, '30.00.0');
assert.equal(lock.version, '30.00.0');
assert.equal(lock.packages[''].version, '30.00.0');
assert.ok(pkg.scripts['test:all'].startsWith('npm run test:v3000 && npm run test:v2980 && npm run test:v2970 && npm run test:v2960 && npm run test:v2950 && npm run test:v2940 && npm run test:v2930') && pkg.scripts['test:all'].includes('npm run test:v2810'));
assert.match(pkg.scripts['test:v2810'], /v28-10-navigation-architecture-regression\.mjs/);
assert.match(globals, /design-system-v2810-navigation\.css";/);
assert.match(globals.trim(), /design-system-v3000-play-publication\.css";$/);
assert.match(css, /Bloco 2: Estrutura e Navegação Premium/);

assert.match(navigation, /bm28-navigation-rail/);
assert.match(navigation, /bm28-mobile-navigation/);
assert.match(navigation, /bm28-mobile-create/);
assert.match(navigation, /bm28-mobile-more-sheet/);
assert.match(navigation, /safeStorageGet/);
assert.doesNotMatch(navigation, /window\.localStorage/);
assert.match(navigation, /bm28-navigation-collapse/);
assert.match(navigation, /ChevronLeft/);
assert.match(navigation, /Nova ficha/);
assert.match(navigation, /Performance/);

assert.match(context, /bm28-context-bar/);
assert.match(context, /Caminho atual/);
assert.match(context, /Ficha aberta/);
assert.match(app, /<PremiumContextBar/);
assert.match(app, /onCreate=\{\(\) => setMobileLauncher\('create'\)\}/);
assert.doesNotMatch(app, /<nav className="desktop-primary-nav v27-primary-nav"/);
assert.doesNotMatch(app, /className="app-side-rail luxury-panel"/);
assert.doesNotMatch(app, /className="mobile-bottom-nav luxury-panel v27-mobile-nav"/);
assert.doesNotMatch(app, /className="topbar-create-action"/);
assert.doesNotMatch(app, /className="topbar-more-action"/);

assert.match(home, /Seu centro de comando tático/);
assert.match(home, /bm28-dashboard-command-row/);
assert.match(home, /Fila de prioridades/);
assert.match(home, /Continue de onde parou/);

assert.match(refinement, /APP_REFINEMENT_VERSION = 2810/);
assert.match(refinement, /buildmaster_navigation_state_v2810/);
assert.match(refinement, /version: 2/);
assert.match(refinement, /LEGACY_NAVIGATION_STATE_KEY/);

assert.equal(manifest.name, 'BuildMaster Elite Tático v30.00');
assert.match(sw, /buildmaster-v30-00/);

console.log('v28.10 navigation architecture regression: ok');
