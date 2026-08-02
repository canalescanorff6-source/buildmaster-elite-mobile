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
assert.match(nativeCache, /NATIVE_CACHE_SCHEMA = '38\.31\.0-ci-regression-hotfix-1'/);
assert.match(serviceWorker, /CACHE_NAME = 'buildmaster-v38-31-ci-regression-hotfix-1'/);
assert.ok(v33.includes('38\\.(?:00|10|20|30|31)'), 'A regressão v33 precisa aceitar o cache v38.31.');
assert.ok(v3771.includes('31\\.0-ci-regression-hotfix'), 'A regressão v37.71 precisa aceitar o cache v38.31.');
assert.ok(doctor.includes('Regressões v38.31'), 'O diagnóstico consolidado precisa executar a v38.31.');
assert.equal(pkg.scripts['test:v3831'], 'node tests/v38-31-ci-regression-hotfix.mjs');

console.log('v38.31 aprovado: contratos legados, cache atual e deduplicação canônica permanecem compatíveis.');
