import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const r500 = pkg.scripts?.['test:r500'] ?? '';
const gate = pkg.scripts?.['ci:gate'] ?? '';
const workflow = fs.readFileSync('.github/workflows/pull-request-validation.yml', 'utf8');

assert.ok(r500, 'package.json precisa expor test:r500');
for (const fragment of [
  'v40-80-r500-contract-regression.ts',
  'v40-80-r500-pro-meta-regression.ts',
  'v40-80-r500-memory-regression.ts',
  'v40-80-r500-engine-regression.ts',
  'v40-80-r500-r489-links-regression.ts',
  'v40-80-r500-ui-regression.mjs',
  'v40-80-r500-team-integration-regression.mjs',
  'v40-80-r500-match-integration-regression.mjs',
  'v40-80-r500-closure-regression.ts',
  'v40-80-r500-ci-gate-regression.mjs'
]) {
  assert.ok(r500.includes(fragment), `test:r500 precisa executar ${fragment}`);
}

assert.match(gate, /npm run test:r489[\s\S]*npm run test:r500/, 'ci:gate da main precisa executar R500 depois de R489');
assert.match(workflow, /R500[^\n]*(closure|seguran|gate)[\s\S]*(v40-80-r500-closure-regression|npm run test:r500)/i, 'PR precisa possuir gate R500 explícito');
assert.match(workflow, /v40-80-r500-ci-gate-regression\.mjs/);

console.log('R500 gate aprovado: PR e main compartilham o contrato completo do diretor tático.');
