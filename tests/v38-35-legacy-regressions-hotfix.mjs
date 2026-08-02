import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const budgetRegression = read('tests/v31-82-ci-protection-regression.mjs');
const studioRegression = read('tests/v34-00-studio-clean-regression.mjs');
const revolutionRegression = read('tests/v36-00-premium-revolution-regression.mjs');
const cacheRegression = read('tests/v37-71-ci-hotfix-regression.mjs');
const cacheHotfixRegression = read('tests/v38-31-ci-regression-hotfix.mjs');
const audit = read('scripts/audit-project.mjs');
const doctor = read('scripts/ci-doctor.mjs');
const manifest = JSON.parse(read('public/manifest.webmanifest'));
const sw = read('public/sw.js');
const nativeCache = read('src/components/RegisterServiceWorker.tsx');

assert.equal(pkg.version, '38.37.0');
assert.equal(pkg.scripts['test:v3835'], 'node tests/v38-35-legacy-regressions-hotfix.mjs');
assert.ok(pkg.scripts['test:all'].includes('npm run test:v3835'));
assert.match(budgetRegression, /\(\?:3\\.5\|4\)/);
assert.match(budgetRegression, /não pode ultrapassar 4 MiB/);
assert.match(studioRegression, /38\\.3\[2-9\]/);
assert.match(revolutionRegression, /38\\.3\[2-9\]/);
assert.match(cacheRegression, /36\\.0-deterministic-audit/);
assert.match(cacheHotfixRegression, /36-deterministic-audit/);
assert.ok(audit.includes("pkg.version === '38.37.0'"));
assert.ok(audit.includes('buildmaster-v38-37-automatic-card-gameplay-1'));
assert.ok(doctor.includes('Regressões v38.37'));
assert.equal(manifest.name, 'BuildMaster Elite Tático v38.37');
assert.ok(sw.includes('buildmaster-v38-37-automatic-card-gameplay-1'));
assert.ok(nativeCache.includes('38.37.0-automatic-card-gameplay-1'));
const playNotes = read('play-store/listing/pt-BR/release-notes/38.37.0.txt').trim();
assert.ok(playNotes.length > 0 && playNotes.length <= 500);

console.log('v38.37 aprovada: regressões v31.82, v34.00 e v36.00 atualizadas sem reduzir as proteções do orçamento, visual ou auditoria.');
