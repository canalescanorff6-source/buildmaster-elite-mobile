import { spawnSync } from 'node:child_process';

const tests = [
  ['contrato', ['-r', './tests/_ts-require.cjs', 'tests/v40-80-r500-contract-regression.ts']],
  ['fingerprints', ['-r', './tests/_ts-require.cjs', 'tests/v40-80-r500-fingerprint-regression.ts']],
  ['coerência contextual', ['-r', './tests/_ts-require.cjs', 'tests/v40-80-r500-context-coherence-regression.ts']],
  ['Pro Meta contrato', ['-r', './tests/_ts-require.cjs', 'tests/v40-80-r500-pro-meta-regression.ts']],
  ['Pro Meta no motor', ['-r', './tests/_ts-require.cjs', 'tests/v40-80-r500-pro-meta-engine-regression.ts']],
  ['memória tática', ['-r', './tests/_ts-require.cjs', 'tests/v40-80-r500-memory-regression.ts']],
  ['motor/confiança', ['-r', './tests/_ts-require.cjs', 'tests/v40-80-r500-engine-regression.ts']],
  ['histerese/fases', ['-r', './tests/_ts-require.cjs', 'tests/v40-80-r500-hysteresis-regression.ts']],
  ['closure', ['-r', './tests/_ts-require.cjs', 'tests/v40-80-r500-closure-regression.ts']],
  ['UI', ['tests/v40-80-r500-ui-regression.mjs']],
  ['Meu Time', ['tests/v40-80-r500-team-integration-regression.mjs']],
  ['Match Trainer', ['tests/v40-80-r500-match-integration-regression.mjs']],
  ['gate PR/main', ['tests/v40-80-r500-ci-gate-regression.mjs']]
];

for (const [label, args] of tests) {
  console.log(`\n[R500] ${label}`);
  const result = spawnSync(process.execPath, args, { stdio: 'inherit', env: process.env, shell: false });
  if (result.error || result.status !== 0) {
    console.error(`[R500] FALHA em ${label}.`);
    process.exit(result.status || 1);
  }
}

console.log('\n[R500] suíte preventiva completa: GREEN.');
