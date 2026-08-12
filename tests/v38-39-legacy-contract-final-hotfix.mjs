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

assert.match(pkg.version, /^(?:38\.(?:39|40)\.0|40\.(?:00|10|20|30|40|50|60|70|80)\.0)$/);
assert.match(pkg.scripts['test:v3839'], /v38-39-legacy-contract-final-hotfix\.mjs/);
assert.match(pkg.scripts['test:v3839'], /v38-39-v3120-deterministic-contract-hotfix\.mjs/);
assert.match(pkg.scripts['test:v3839'], /v38-39-v3100-github-deterministic-hotfix\.mjs/);
assert.ok(pkg.scripts['test:all'].includes('npm run test:v3839'));
assert.ok(doctor.includes("['Regressões v38.39', ['run', 'test:v3839']]"));
assert.ok(v33.includes('|38|39|40)'), 'A regressão v33 deve reconhecer o cache atual sem apagar versões anteriores.');
assert.ok(v35.includes('assert.doesNotMatch(cacheRegression'), 'A v38.35 deve rejeitar sufixos estáticos no contrato v37.71.');
assert.ok(v35.includes('assert.doesNotMatch(cacheHotfixRegression'), 'A v38.35 deve rejeitar sufixos estáticos no contrato v38.31.');
assert.ok(v3771.includes('formato versionado'));
assert.ok(v3831.includes("const [major, minor] = pkg.version.split('.')"));
assert.match(sw, /buildmaster-(?:v38-(?:39-legacy-contract-final|40-background-ocr-resume)-1|v40-(?:00-card-reader-rebuild|10-progress|20-progress|70-live-catalog-ocr|80-edge-stack)-1)/);
assert.match(nativeCache, /(?:38\.(?:39\.0-legacy-contract-final|40\.0-background-ocr-resume)-1|40\.(?:(?:00|10)\.0-fail-open-startup|(?:20|70)\.0-progress-runtime|80\.0-edge-stack-runtime)-1)/);
assert.ok(fs.existsSync('tests/v38-39-v3120-deterministic-contract-hotfix.mjs'));
assert.doesNotMatch(pkg.scripts['test:v3120'], /typecheck:v3110/);

console.log('v38.39 aprovada: contrato legado v38.35 corrigido definitivamente sem sufixos fixos de versões antigas.');
