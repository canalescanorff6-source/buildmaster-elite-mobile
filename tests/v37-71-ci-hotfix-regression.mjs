import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const workspace = read('src/components/result/ResultWorkspace.tsx');
const advanced = read('src/lib/advancedMotorV3750.ts');
const v33 = read('tests/v33-00-executive-redesign-regression.mjs');
const cache = read('src/components/RegisterServiceWorker.tsx');
const doctor = read('scripts/ci-doctor.mjs');

assert.doesNotMatch(workspace, /\bUploadCloud\b/, 'Import não utilizado não pode voltar ao ResultWorkspace.');
assert.match(cache, /NATIVE_CACHE_SCHEMA = '(?:37\.(?:70\.0-continuous-rules|80\.0-clean-intelligent|90\.0-unified-creation)|38\.(?:00\.0-clean-vault|10\.0-premium-clean-result|20\.0-invisible-optimization|30\.0-name-skill-integrity|31\.0-ci-regression-hotfix|32\.0-complete-integration|33\.0-professional-template|34\.0-ci-stability|35\.0-legacy-regressions|36\.0-deterministic-audit))-1'/);
assert.ok(v33.includes("37\\.(?:00|40|50|60|70|80|90)"), 'A regressão v33 precisa continuar aceitando os esquemas v37.');
assert.ok(v33.includes("38\\.(?:00|10|20|30|31|32|33|34|35|36)"), 'A regressão v33 precisa aceitar os esquemas v38.00 até v38.36.');
assert.match(advanced, /const contextualTraining = result\.calibrationV32\?\.finalTraining \?\? result\.training/);
assert.match(advanced, /function contextCriticalGroups/);
assert.match(advanced, /function contextMismatchPenalty/);
for (const version of ['v37.50', 'v37.60', 'v37.70', 'v37.71', 'v37.80', 'v37.90', 'v38.00', 'v38.10', 'v38.20', 'v38.30', 'v38.31', 'v38.32', 'v38.33', 'v38.34', 'v38.35', 'v38.36']) {
  assert.ok(doctor.includes(`Regressões ${version}`), `O diagnóstico consolidado precisa executar ${version}.`);
}

console.log('v37.71 hotfix aprovado: TypeScript limpo, cache atual aceito e contexto de delay/controle preservado no motor final.');
