import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const pkg = JSON.parse(read('package.json'));
const doctor = read('scripts/ci-doctor.mjs');
const v33 = read('tests/v33-00-executive-redesign-regression.mjs');
const v35 = read('tests/v38-35-legacy-regressions-hotfix.mjs');
const v3771 = read('tests/v37-71-ci-hotfix-regression.mjs');
const v3831 = read('tests/v38-31-ci-regression-hotfix.mjs');
const sw = read('public/sw.js');
const nativeCache = read('src/components/RegisterServiceWorker.tsx');

assert.equal(pkg.version, '38.39.0');
assert.equal(pkg.scripts['test:v3839'], 'node tests/v38-39-legacy-contract-final-hotfix.mjs');
assert.ok(pkg.scripts['test:all'].includes('npm run test:v3839'));
assert.ok(doctor.includes("['Regressões v38.39', ['run', 'test:v3839']]"));
assert.ok(v33.includes('|38|39)'), 'A regressão v33 deve reconhecer o cache atual sem apagar versões anteriores.');
assert.ok(v35.includes('assert.doesNotMatch(cacheRegression'), 'A v38.35 deve rejeitar sufixos estáticos no contrato v37.71.');
assert.ok(v35.includes('assert.doesNotMatch(cacheHotfixRegression'), 'A v38.35 deve rejeitar sufixos estáticos no contrato v38.31.');
assert.ok(v3771.includes('formato versionado'));
assert.ok(v3831.includes("const [major, minor] = pkg.version.split('.')"));
assert.ok(sw.includes('buildmaster-v38-39-legacy-contract-final-1'));
assert.ok(nativeCache.includes('38.39.0-legacy-contract-final-1'));

console.log('v38.39 aprovada: contrato legado v38.35 corrigido definitivamente sem sufixos fixos de versões antigas.');
