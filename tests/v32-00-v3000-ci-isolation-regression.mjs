import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const doctor = fs.readFileSync('scripts/ci-doctor.mjs', 'utf8');
const legacy = String(pkg.scripts?.['test:v3000'] ?? '');
const core = String(pkg.scripts?.['test:v3000:core'] ?? '');

assert.equal(legacy, 'npm run test:v3000:core', 'A regressão v30.00 deve delegar somente ao núcleo legado isolado.');
assert.match(core, /typecheck:v3000/, 'O typecheck legado precisa continuar protegido.');
assert.match(core, /v30-00-play-publication-regression\.ts/, 'A publicação Play v30.00 precisa continuar coberta.');
assert.match(core, /v30-00-integrated-production-regression\.mjs/, 'A integração de produção v30.00 precisa continuar coberta.');
assert.match(core, /v30-00-play-workflow-regression\.mjs/, 'O workflow Play legado precisa continuar coberto.');
for (const duplicated of ['release:play-preflight', 'quality:syntax', 'quality:interactive', 'release:preflight']) {
  assert.doesNotMatch(core, new RegExp(duplicated.replace(':', '\\:')), `A regressão v30.00 não deve repetir o grupo global ${duplicated}.`);
}
assert.ok(doctor.includes("['Regressões v30.00', ['run', 'test:v3000:core']]"), 'O ci-doctor deve executar diretamente o núcleo legado, sem repetir pre-hooks.');
for (const globalLabel of ['Sintaxe TypeScript/TSX', 'Contratos interativos', 'Pré-voo de produção', 'Pré-voo Google Play']) {
  assert.ok(doctor.includes(`['${globalLabel}'`), `O ci-doctor precisa executar separadamente: ${globalLabel}.`);
}
console.log('v32.00 isolamento da regressão v30.00 aprovado: testes legados não repetem validações globais do CI.');
