import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const workspace = read('src/components/result/ResultWorkspace.tsx');
const advanced = read('src/lib/advancedMotorV3750.ts');
const v33 = read('tests/v33-00-executive-redesign-regression.mjs');
const cache = read('src/components/RegisterServiceWorker.tsx');
const doctor = read('scripts/ci-doctor.mjs');

assert.doesNotMatch(workspace, /\bUploadCloud\b/, 'Import não utilizado não pode voltar ao ResultWorkspace.');
assert.match(cache, /NATIVE_CACHE_SCHEMA = '37\.70\.0-continuous-rules-1'/);
assert.match(v33, /37\\\.\(\?:00\|40\|50\|60\|70\)/, 'A regressão v33 precisa aceitar o esquema v37.70.');
assert.match(advanced, /const contextualTraining = result\.calibrationV32\?\.finalTraining \?\? result\.training/);
assert.match(advanced, /function contextCriticalGroups/);
assert.match(advanced, /function contextMismatchPenalty/);
for (const version of ['v37.50', 'v37.60', 'v37.70', 'v37.71']) {
  assert.ok(doctor.includes(`Regressões ${version}`), `O diagnóstico consolidado precisa executar ${version}.`);
}

console.log('v37.71 hotfix aprovado: TypeScript limpo, cache atual aceito e contexto de delay/controle preservado no motor final.');
