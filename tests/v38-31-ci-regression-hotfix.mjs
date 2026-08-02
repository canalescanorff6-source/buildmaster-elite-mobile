import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const app = read('src/components/CardVisionApp.tsx');
const nativeCache = read('src/components/RegisterServiceWorker.tsx');
const serviceWorker = read('public/sw.js');
const v33 = read('tests/v33-00-executive-redesign-regression.mjs');
const v3771 = read('tests/v37-71-ci-hotfix-regression.mjs');
const doctor = read('scripts/ci-doctor.mjs');
const pkg = JSON.parse(read('package.json'));

assert.match(app, /nativeSkills: Array\.from\(new Set\(canonicalizeSkillList\(\[/,
  'O inventário completo precisa manter deduplicação explícita e normalização canônica.');
assert.match(nativeCache, /NATIVE_CACHE_SCHEMA = '38\.(?:31\.0-ci-regression-hotfix|32\.0-complete-integration|33\.0-professional-template|34\.0-ci-stability|35\.0-legacy-regressions|36\.0-deterministic-audit)-1'/);
assert.match(serviceWorker, /CACHE_NAME = 'buildmaster-v38-(?:31-ci-regression-hotfix|32-complete-integration|33-professional-template|34-ci-stability|35-legacy-regressions|36-deterministic-audit)-1'/);
assert.ok(v33.includes('38\\.(?:00|10|20|30|31|32|33|34|35|36)'), 'A regressão v33 precisa aceitar os caches atuais.');
assert.ok(v3771.includes('36\\.0-deterministic-audit'), 'A regressão v37.71 precisa aceitar o cache v38.36.');
assert.ok(doctor.includes('Regressões v38.31'), 'O diagnóstico consolidado precisa executar a v38.31.');
assert.equal(pkg.scripts['test:v3831'], 'node tests/v38-31-ci-regression-hotfix.mjs');

console.log('v38.31 aprovado: contratos legados, cache atual e deduplicação canônica permanecem compatíveis.');
