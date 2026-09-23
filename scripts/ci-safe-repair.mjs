import { spawnSync } from 'node:child_process';

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
if (failed) process.exit(1);
console.log('\nReparos determinísticos seguros concluídos.');
