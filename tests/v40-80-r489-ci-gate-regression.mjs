import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const r489 = pkg.scripts?.['test:r489'] ?? '';
const gate = pkg.scripts?.['ci:gate'] ?? '';
const workflow = fs.readFileSync('.github/workflows/pull-request-validation.yml', 'utf8');
const doctorConfig = fs.readFileSync('scripts/ci-doctor-config.mjs', 'utf8');

assert.ok(r489, 'package.json precisa expor test:r489');
for (const fragment of [
  'v40-80-r489-explainable-ai-regression.ts',
  'v40-80-r489-explainable-ai-closure-regression.ts',
  'v40-80-r489-explainable-ai-ui-regression.mjs',
  'v40-80-r489-result-integration-regression.mjs',
  'v40-80-r489-team-integration-regression.mjs',
  'v40-80-r489-match-integration-regression.mjs'
]) {
  assert.ok(r489.includes(fragment), `test:r489 precisa executar ${fragment}`);
}

assert.match(gate, /npm run test:r489/, 'ci:gate da main precisa executar test:r489');
assert.match(workflow, /R489[^\n]*gate preventivo da main[\s\S]*node tests\/v40-80-r489-ci-gate-regression\.mjs/);

// A5: o gate preventivo do Pull Request precisa executar o mesmo fechamento mestre
// R419 que o diagnóstico completo de release. Sem esta paridade, uma regressão em
// R501-R518 pode passar pelo PR e só aparecer depois do merge na main.
assert.match(
  doctorConfig,
  /\['Reader\/closure R419-R456', \['run', 'test:r419'\]\]/,
  'A5: diagnóstico completo de release precisa manter test:r419 como master gate.',
);
assert.match(
  workflow,
  /A5[^\n]*gate mestre R419[\s\S]*npm run test:r419/,
  'A5: workflow de Pull Request precisa executar test:r419 antes do merge.',
);
assert.match(
  workflow,
  /npm run test:r419[\s\S]{0,240}git diff --exit-code/,
  'A5: PR precisa falhar se test:r419 auto-materializar mudança rastreada não commitada.',
);

console.log('R489/A5 gate aprovado: PR e main compartilham R489 e o fechamento mestre R419 com guarda de árvore limpa.');
