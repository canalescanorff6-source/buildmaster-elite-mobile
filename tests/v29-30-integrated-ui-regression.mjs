import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const lock = JSON.parse(read('package-lock.json'));
const globals = read('src/app/globals.css').trim();
const layout = read('src/app/layout.tsx');
const app = read('src/components/CardVisionApp.tsx');
const analyzer = read('src/lib/analyzer.ts');
const lazy = read('src/components/lazy/AppLazyPanels.tsx');
const workflow = read('.github/workflows/build-apk.yml');

assert.equal(pkg.version, '30.00.0');
assert.equal(lock.version, '30.00.0');
assert.equal(lock.packages[''].version, '30.00.0');
assert.ok(pkg.scripts['test:all'].startsWith('npm run test:v3000 && npm run test:v2980 && npm run test:v2970 && npm run test:v2960 && npm run test:v2950 && npm run test:v2940 && npm run test:v2930') && pkg.scripts['test:all'].includes('npm run test:v2930'));
assert.ok(globals.includes('@import "./design-system-v2930-intelligence-base.css";'));
assert.ok(globals.endsWith('@import "./design-system-v3000-play-publication.css";'));
assert.match(layout, /bm-v2930-intelligence/);
assert.match(lazy, /OcrVisionCenter/);
assert.match(lazy, /OfficialRulesCenter/);
assert.match(app, /<OcrVisionCenter/);
assert.match(app, /<OfficialRulesCenter/);
assert.match(app, /buildOcrVisionAudit/);
assert.match(app, /officialPack: readOfficialRulePack\(\)/);
assert.match(app, /sanitizeOfficialRulePack/);
assert.match(analyzer, /analyzerCatalog/);
assert.match(analyzer, /findOfficialCardRule/);
assert.doesNotMatch(analyzer, /const POSITION_ALIASES:/);
assert.doesNotMatch(analyzer, /const BASE_BY_POSITION:/);
assert.ok(app.split('\n').length < 4000, `CardVisionApp ainda possui ${app.split('\n').length} linhas`);
assert.ok(analyzer.split('\n').length < 3500, `analyzer ainda possui ${analyzer.split('\n').length} linhas`);
for (const file of [
  'src/modules/architecture/appOptions.ts',
  'src/modules/architecture/moduleRegistry.ts',
  'src/modules/analysis/analyzerCatalog.ts',
  'src/modules/analysis/index.ts',
  'src/modules/card-reader/ocrVisionEngine.ts',
  'src/modules/card-reader/OcrVisionCenter.tsx',
  'src/modules/rules/officialRuleRegistry.ts',
  'src/modules/rules/OfficialRulesCenter.tsx'
]) assert.ok(fs.existsSync(file), `${file} ausente`);
assert.match(workflow, /npm run test:all/);
assert.doesNotMatch(workflow, /npm run test:v2930\n/);
assert.match(workflow, /MANIFESTO_PRODUCAO_V30\.00\.sha256/);
console.log('v29.30 integrated UI and architecture regression: OK');
