import { execFileSync } from 'node:child_process';

const jsTests = [
  'tests/v40-80-r542-reader-v2-architecture-regression.mjs',
  'tests/v40-80-r542-reader-v2-image-session-regression.mjs',
  'tests/v40-80-r542-reader-v2-review-regression.mjs',
  'tests/v40-80-r542-reader-v2-integration-regression.mjs',
];
const tsTests = [
  'tests/v40-80-r542-reader-v2-worker-regression.ts',
  'tests/v40-80-r542-reader-v2-zones-regression.ts',
  'tests/v40-80-r542-reader-v2-bridge-regression.ts',
  'tests/v40-80-r542-reader-v2-automatic-regression.ts',
];

for (const test of jsTests) execFileSync(process.execPath, [test], { stdio: 'inherit' });
for (const test of tsTests) execFileSync(process.execPath, ['-r', './tests/_ts-require.cjs', test], { stdio: 'inherit' });

console.log('R542 acceptance GREEN: arquitetura, memória, lifecycle, quadrados, review, bridge, automático e integração aprovados.');
