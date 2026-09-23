import { spawnSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const nodeCommand = process.execPath;

const checks = [
  ['R457 Stage 1', nodeCommand, ['tests/v40-80-r457-stage1-authority-canonical-regression.mjs']],
  ['R457 Stage 2', nodeCommand, ['-r','./tests/_ts-require.cjs','tests/v40-80-r457-stage2-card-edition-identity-regression.ts']],
  ['R457 Stage 3', nodeCommand, ['-r','./tests/_ts-require.cjs','tests/v40-80-r457-stage3-usage-function-position-style-regression.ts']],
  ['R457 Stage 3b', nodeCommand, ['-r','./tests/_ts-require.cjs','tests/v40-80-r457-stage3b-usage-function-e2e-regression.ts']],
  ['R457 Stage 4', nodeCommand, ['-r','./tests/_ts-require.cjs','tests/v40-80-r457-stage4-exact-training-certificate-regression.ts']],
  ['R457 skills', npmCommand, ['run','test:r457:skills']],
  ['R457 impeto', npmCommand, ['run','test:r457:impeto']],
  ['R457 joint frontier', npmCommand, ['run','test:r457:joint']],
  ['R457 canonical DNA', npmCommand, ['run','test:r457:dna']],
  ['R457 scouting', npmCommand, ['run','test:r457:scouting']],
  ['R457 match scouting', npmCommand, ['run','test:r457:match-scouting']],
  ['R457 lineup', npmCommand, ['run','test:r457:lineup']],
  ['R457 rotation', npmCommand, ['run','test:r457:rotation:all']],
  ['R124 phase/live catalog', npmCommand, ['run','test:r124']],
  ['R457/R125 identity-style-DNA', npmCommand, ['run','test:r457:r125-fast']],
  ['R126', npmCommand, ['run','test:r126']],
  ['R128', npmCommand, ['run','test:r128']],
  ['R135', npmCommand, ['run','test:r135']],
  ['R136', npmCommand, ['run','test:r136']],
  ['R137', npmCommand, ['run','test:r137']],
  ['R184 position stability', nodeCommand, ['-r','./tests/_ts-require.cjs','tests/v40-80-r184-position-stability-regression.ts']],
  ['R157 session autosave boundary', nodeCommand, ['tests/v40-80-r157-session-autosave-boundary-regression.mjs']],
  ['R177 startup lifecycle boundary', nodeCommand, ['tests/v40-80-r177-cardvision-startup-lifecycle-boundary-regression.mjs']],
  ['Longitudinal gameplay runtime', nodeCommand, ['-r','./tests/_ts-require.cjs','tests/v40-60-longitudinal-gameplay-runtime-regression.ts']],
  ['Longitudinal gameplay source', nodeCommand, ['tests/v40-60-longitudinal-gameplay-regression.mjs']],
  ['R457 integration', npmCommand, ['run','test:r457:integration']],
  ['R458', npmCommand, ['run','test:r458']],
  ['R457 source canonical', npmCommand, ['run','test:r457:source-canonical']],
  ['R457 release gate', npmCommand, ['run','test:r457:release-gate']],
  ['R459', npmCommand, ['run','test:r459']],
  ['R460-R463', npmCommand, ['run','test:r460-463']],
];

const failures = [];
for (const [label, command, args] of checks) {
  console.log(`\n========== ${label} ==========`);
  const result = spawnSync(command, args, { stdio: 'inherit', env: process.env, shell: false });
  if (result.error || result.status !== 0) {
    failures.push({ label, status: result.status ?? 'erro', error: result.error?.message });
    console.error(`✗ ${label} falhou; continuando para revelar as demais falhas.`);
  } else {
    console.log(`✓ ${label} aprovado.`);
  }
}

console.log('\n========== RESUMO R457-R463 ==========');
console.log(`Blocos executados: ${checks.length}`);
if (failures.length) {
  console.error(`Falhas encontradas: ${failures.length}`);
  for (const failure of failures) {
    console.error(`- ${failure.label} (código ${failure.status})${failure.error ? `: ${failure.error}` : ''}`);
  }
  process.exit(1);
}
console.log('Contrato R457-R463 totalmente aprovado.');
