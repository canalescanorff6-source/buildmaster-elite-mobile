import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const size = (file) => fs.statSync(file).size;
const lines = (file) => read(file).split(/\r?\n/).length;
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const cardVision = read('src/components/CardVisionApp.tsx');
const analyzer = read('src/lib/analyzer.ts');
const globals = read('src/app/globals.css');
const layout = read('src/app/layout.tsx');

assert.equal(pkg.version, '29.10.0');
assert.equal(lock.version, '29.10.0');
assert.equal(lock.packages[''].version, '29.10.0');
assert.match(pkg.scripts['test:all'], /^(?:npm run test:v2910 && )?(?:npm run test:v2900 && )?(?:npm run test:v2880 && )?(?:npm run test:v2870 && )?npm run test:v2860 && npm run test:v2850 && npm run test:v2840/);
assert.match(pkg.scripts['test:v2850'], /v28-50-architecture-performance-regression\.mjs/);

for (const file of [
  'src/components/lazy/AppLazyPanels.tsx',
  'src/components/result/ResultWorkspace.tsx',
  'src/components/ArchitectureHealthPanel.tsx',
  'src/modules/squad/TeamFullMapPanel.tsx',
  'src/modules/vault/cardHistoryStore.ts',
  'src/modules/builds/dynamicRules.ts',
  'src/modules/builds/buildReportExport.ts',
  'src/modules/builds/trainingOptimizer.ts',
  'src/lib/performanceScheduler.ts',
  'src/modules/matches/calibrationStorage.ts',
  'src/app/design-system-v2850-architecture.css'
]) {
  assert.equal(fs.existsSync(file), true, `${file} precisa existir`);
}

assert.ok(size('src/components/CardVisionApp.tsx') < 300_000, 'CardVisionApp deve ficar abaixo de 300 KB');
assert.ok(lines('src/components/CardVisionApp.tsx') < 4_500, 'CardVisionApp deve ficar abaixo de 4.500 linhas');
assert.ok(size('src/lib/analyzer.ts') < 260_000, 'analyzer deve ficar abaixo de 260 KB');
assert.ok(lines('src/lib/analyzer.ts') < 3_900, 'analyzer deve ficar abaixo de 3.900 linhas');

assert.doesNotMatch(cardVision, /from ['"]next\/dynamic['"]/);
assert.match(cardVision, /from ['"]@\/components\/lazy\/AppLazyPanels['"]/);
assert.match(cardVision, /from ['"]@\/components\/result\/ResultWorkspace['"]/);
assert.match(cardVision, /from ['"]@\/modules\/squad\/TeamFullMapPanel['"]/);
assert.match(cardVision, /from ['"]@\/modules\/vault\/cardHistoryStore['"]/);
assert.match(cardVision, /scheduleIdleTask/);
assert.match(analyzer, /from ['"]\.\.\/modules\/builds\/trainingOptimizer['"]/);
assert.match(globals.trim(), /design-system-v2910-admin-update\.css";$/);
assert.match(layout, /bm-v2850-architecture/);

console.log('v28.50 architecture and performance regression: ok');
