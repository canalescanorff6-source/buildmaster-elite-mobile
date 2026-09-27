import assert from 'node:assert/strict';
import fs from 'node:fs';

const runner = fs.readFileSync('scripts/run-r500-tests.mjs', 'utf8');
const doctor = fs.readFileSync('scripts/ci-doctor.mjs', 'utf8');
const workflow = fs.readFileSync('.github/workflows/pull-request-validation.yml', 'utf8');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

for (const file of [
  'v40-80-r500-contract-regression.ts',
  'v40-80-r500-fingerprint-regression.ts',
  'v40-80-r500-context-coherence-regression.ts',
  'v40-80-r500-pro-meta-regression.ts',
  'v40-80-r500-pro-meta-engine-regression.ts',
  'v40-80-r500-memory-regression.ts',
  'v40-80-r500-engine-regression.ts',
  'v40-80-r500-hysteresis-regression.ts',
  'v40-80-r500-closure-regression.ts',
  'v40-80-r500-ui-regression.mjs',
  'v40-80-r500-team-integration-regression.mjs',
  'v40-80-r500-match-integration-regression.mjs'
]) {
  assert.ok(runner.includes(file), `runner R500 precisa executar ${file}`);
}

assert.match(doctor, /run-r500-tests\.mjs/, 'ci-doctor precisa executar a suíte R500');
assert.match(pkg.scripts?.['ci:gate'] ?? '', /ci:preflight/, 'ci:gate da main precisa continuar passando pelo ci:preflight');
assert.match(workflow, /Regressões R500 — Autonomous Tactical Director/);
assert.match(workflow, /v40-80-r500-context-coherence-regression\.ts/);
assert.match(workflow, /v40-80-r500-pro-meta-engine-regression\.ts/);
assert.match(workflow, /v40-80-r500-match-integration-regression\.mjs/);

console.log('R500 gate aprovado: PR e main/APK compartilham a proteção preventiva do Diretor Tático.');
