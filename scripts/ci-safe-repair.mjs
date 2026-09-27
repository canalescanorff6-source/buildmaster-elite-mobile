import { spawnSync } from 'node:child_process';
import { applyTotalReaderFinalizationR501 } from './apply-r501-total-reader-finalization.mjs';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const repairs = [
  ['TypeScript raiz', ['run', 'types:repair']],
  ['Sanitização forward-only', ['run', 'sanitize:update-source']],
  ['Rotas críticas', ['run', 'routes:repair']]
];

let failed = false;
for (const [label, args] of repairs) {
  console.log(`\n[CI SAFE REPAIR] ${label}`);
  const result = spawnSync(npmCommand, args, { stdio: 'inherit', env: process.env, shell: false });
  if (result.error || result.status !== 0) {
    failed = true;
    console.error(`Falha no reparo determinístico: ${label}`);
  }
}

if (!failed) {
  console.log('\n[CI SAFE REPAIR] Card Truth R501 — finalização do Leitor Total');
  try {
    const result = applyTotalReaderFinalizationR501(process.cwd());
    console.log(result.changed
      ? `R501 Total Reader ajustou ${result.patched.length} arquivo(s).`
      : 'R501 Total Reader já estava convergido.');
  } catch (error) {
    failed = true;
    console.error('Falha no reparo determinístico: Card Truth R501 — finalização do Leitor Total');
    console.error(error);
  }
}

if (failed) process.exit(1);
console.log('\nReparos determinísticos seguros concluídos.');
