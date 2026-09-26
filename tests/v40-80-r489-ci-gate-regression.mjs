import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const r489 = pkg.scripts?.['test:r489'] ?? '';
const gate = pkg.scripts?.['ci:gate'] ?? '';
const workflow = fs.readFileSync('.github/workflows/pull-request-validation.yml', 'utf8');

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

console.log('R489 gate aprovado: PR e main compartilham o contrato explicável completo.');
