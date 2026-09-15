import { spawnSync } from 'node:child_process';
import { applyR417Fix2StableVaultActionIdentity } from './apply-r417-fix2-stable-vault-action-identity.mjs';

const r417Fix2 = applyR417Fix2StableVaultActionIdentity();
if (r417Fix2.changed) {
  console.log('R417-fix2 aplicado antes do contrato TypeScript R151.');
}

const run = spawnSync('tsc', ['-p', 'tests/types-r151/tsconfig.json', '--pretty', 'false'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});
const output = `${run.stdout || ''}${run.stderr || ''}`.trim();
if (run.status !== 0) {
  console.error('R151: o contrato TypeScript de toda a pasta src falhou.');
  if (output) console.error(output);
  process.exit(run.status || 1);
}
console.log('R151 aprovado: toda a pasta src passou no contrato TypeScript autocontido do pacote limpo.');
