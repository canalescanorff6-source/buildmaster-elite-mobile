import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const workspace = read('src/components/result/ResultWorkspace.tsx');
const advanced = read('src/lib/advancedMotorV3750.ts');
const v33 = read('tests/v33-00-executive-redesign-regression.mjs');
const cache = read('src/components/RegisterServiceWorker.tsx');
const doctor = read('scripts/ci-doctor.mjs');
const pkg = JSON.parse(read('package.json'));

assert.doesNotMatch(workspace, /\bUploadCloud\b/, 'Import não utilizado não pode voltar ao ResultWorkspace.');

// A v37.71 protege a existência do contrato de cache sem duplicar a lista de
// versões aceita pela regressão v33. Essa lista pertence à própria v33 e é
// validada quando o grupo v33.00 roda no diagnóstico consolidado.
assert.match(cache, /NATIVE_CACHE_SCHEMA = '(?:(?:37|38)\.\d+\.0|40\.(?:00|10|20|30|40|50|60|70|80)\.0)-[^']+-1'/,
  'O esquema nativo atual precisa manter o formato versionado reconhecido pelo atualizador.');
assert.match(v33, /assert\.match\(cache, \/NATIVE_CACHE_SCHEMA/,
  'A regressão v33 precisa continuar validando o esquema nativo atual.');
assert.ok(v33.includes('38\\.(?:00|10|20|30|31|32|33|34|35|36|37|38|39|40)'),
  'A regressão v33 precisa aceitar o esquema ativo da v38.39.');

assert.match(advanced, /const contextualTraining = result\.calibrationV32\?\.finalTraining \?\? result\.training/);
assert.match(advanced, /function contextCriticalGroups/);
assert.match(advanced, /function contextMismatchPenalty/);

for (const version of ['v37.50', 'v37.60', 'v37.70', 'v37.71', 'v37.80', 'v37.90', 'v38.00', 'v38.10', 'v38.20', 'v38.30', 'v38.31', 'v38.32', 'v38.33', 'v38.34', 'v38.35', 'v38.36', 'v38.37', 'v38.38', 'v38.39']) {
  assert.ok(doctor.includes(`Regressões ${version}`), `O diagnóstico consolidado precisa executar ${version}.`);
}

assert.equal(pkg.version, '40.80.0');
console.log('v37.71 hotfix aprovado: TypeScript limpo, contrato de cache atual validado sem lista legada frágil e contexto de delay/controle preservado.');
