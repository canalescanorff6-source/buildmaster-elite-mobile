import { spawnSync } from 'node:child_process';

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
