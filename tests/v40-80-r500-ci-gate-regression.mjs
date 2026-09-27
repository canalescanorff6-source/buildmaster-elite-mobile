import assert from 'node:assert/strict';
import fs from 'node:fs';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const r500 = pkg.scripts?.['test:r500'] ?? '';
const gate = pkg.scripts?.['ci:gate'] ?? '';
const workflow = fs.readFileSync('.github/workflows/pull-request-validation.yml', 'utf8');
const redispatch = fs.readFileSync('.github/workflows/zero-red-redispatch.yml', 'utf8');

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

assert.match(redispatch, /workflow_run:/, 'redisparo Zero-Red precisa reagir ao término do workflow do APK.');
assert.match(redispatch, /workflows:\s*\["Gerar APK Canal Direto"\]/, 'redisparo precisa observar somente o workflow oficial do APK.');
assert.match(redispatch, /actions:\s*write/, 'workflow de redisparo precisa da permissão mínima de Actions para disparar o APK.');
assert.match(redispatch, /contents:\s*read/, 'workflow de redisparo não precisa escrever no repositório.');
assert.match(redispatch, /workflow_run\.conclusion\s*==\s*'failure'/, 'redisparo deve ser avaliado somente após falha do run anterior.');
assert.match(redispatch, /workflow_run\.head_branch\s*==\s*'main'/, 'redisparo deve ser limitado à main.');
assert.match(redispatch, /PARENT_SHA[\s\S]*FAILED_HEAD_SHA/, 'redisparo precisa provar que o novo main é filho direto do SHA que falhou.');
assert.match(redispatch, /chore\(ci\): autoestabiliza fonte pela Regra Zero-Red/, 'redisparo precisa exigir a mensagem canônica do auto-commit Zero-Red.');
assert.match(redispatch, /gh workflow run build-apk\.yml --ref main/, 'redisparo precisa iniciar o workflow oficial no main estabilizado.');

console.log('R500 gate aprovado: PR/main compartilham o contrato e o Zero-Red possui redisparo isolado e seguro.');
