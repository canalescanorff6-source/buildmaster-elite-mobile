import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const json = (file) => JSON.parse(read(file));

const pkg = json('package.json');
const lock = json('package-lock.json');
const globals = read('src/app/globals.css');
const screens = read('src/app/design-system-v2820-screens.css');
const layout = read('src/app/layout.tsx');
const app = [read('src/components/CardVisionApp.tsx'), read('src/components/result/ResultWorkspace.tsx')].join('\n');
const primitives = read('src/components/PremiumScreenPrimitives.tsx');
const players = read('src/modules/players/PlayerLaboratory.tsx');
const team = read('src/modules/squad/IntegratedTeamLab.tsx');
const matches = read('src/modules/matches/MatchLaboratory.tsx');
const manifest = json('public/manifest.webmanifest');
const sw = read('public/sw.js');

assert.equal(pkg.version, '29.10.0');
assert.equal(lock.version, '29.10.0');
assert.equal(lock.packages[''].version, '29.10.0');
assert.match(pkg.scripts['test:all'], /^(?:npm run test:v2910 && )?(?:npm run test:v2900 && )?(?:npm run test:v2880 && )?(?:npm run test:v2870 && )?npm run test:v2860 && npm run test:v2850 && npm run test:v2840 && npm run test:v2830 && npm run test:v2820 && npm run test:v2810/);
assert.match(pkg.scripts['test:v2820'], /v28-20-main-screens-regression\.mjs/);
assert.match(globals.trim(), /design-system-v2910-admin-update\.css";$/);
assert.match(layout, /bm-v2820-screens/);
assert.match(app, /bm2820-screen-system/);
assert.match(app, /bm2820-creation-hero/);
assert.match(app, /bm2820-control-panel/);
assert.match(app, /bm2820-result-screen/);
assert.match(app, /bm2820-review-screen/);
assert.match(app, /bm2820-vault-screen/);
assert.match(app, /bm2820-settings-screen/);
assert.match(app, /bm2820-preview-panel/);
assert.match(primitives, /export function PremiumScreenHero/);
assert.match(primitives, /bm2820-screen-metrics/);
assert.match(players, /PremiumScreenHero/);
assert.match(players, /bm2820-players-screen/);
assert.match(team, /PremiumScreenHero/);
assert.match(team, /bm2820-team-screen/);
assert.match(matches, /PremiumScreenHero/);
assert.match(matches, /bm2820-performance-screen/);
for (const selector of [
  '.bm2820-screen-hero',
  '.bm2820-players-screen',
  '.bm2820-creation-hero',
  '.bm2820-result-screen',
  '.bm2820-vault-screen',
  '.bm2820-team-screen',
  '.bm2820-performance-screen',
  '.bm2820-settings-screen',
  '.auth-login-screen'
]) assert.ok(screens.includes(selector), `seletor ausente: ${selector}`);
assert.match(screens, /@media \(max-width:800px\)/);
assert.match(screens, /premium-app\.theme-dark/);
assert.match(screens, /prefers-reduced-motion/);
assert.equal(manifest.name, 'BuildMaster Elite Tático v29.10');
assert.match(sw, /buildmaster-v29-10/);

console.log('v28.30 main screens regression: ok');
