import { spawnSync } from 'node:child_process';
import { applyR417Fix2StableVaultActionIdentity } from './apply-r417-fix2-stable-vault-action-identity.mjs';
import { applyR418UnboundedCapacity } from './apply-r418-unbounded-capacity.mjs';
import { applyR418Fix2HistoricalCapacityContracts } from './apply-r418-fix2-historical-contracts.mjs';

const r417Fix2 = applyR417Fix2StableVaultActionIdentity();
if (r417Fix2.changed) {
  console.log('R417-fix2 aplicado antes do contrato TypeScript R151.');
}

const r418 = applyR418UnboundedCapacity();
if (r418.changed) {
  console.log(`R418 aplicado antes do contrato TypeScript R151 (${r418.patched.length} arquivo(s)).`);
}
const r418Fix2 = applyR418Fix2HistoricalCapacityContracts();
if (r418Fix2.changed) {
  console.log(`R418-fix2 convergiu contratos históricos antes do R151 (${r418Fix2.patched.length} arquivo(s)).`);
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
const r418Regression = spawnSync(process.execPath, ['tests/v40-80-r418-unbounded-persistent-collections-regression.mjs'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});
const r418Output = `${r418Regression.stdout || ''}${r418Regression.stderr || ''}`.trim();
if (r418Regression.status !== 0) {
  console.error('R151/R418: o contrato de coleções persistentes sem teto artificial falhou.');
  if (r418Output) console.error(r418Output);
  process.exit(r418Regression.status || 1);
}
if (r418Output) console.log(r418Output);
const r418Fix2Regression = spawnSync(process.execPath, ['tests/v40-80-r418-fix2-historical-capacity-contracts-regression.mjs'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});
const r418Fix2Output = `${r418Fix2Regression.stdout || ''}${r418Fix2Regression.stderr || ''}`.trim();
if (r418Fix2Regression.status !== 0) {
  console.error('R151/R418-fix2: contratos históricos de capacidade voltaram a exigir tetos artificiais.');
  if (r418Fix2Output) console.error(r418Fix2Output);
  process.exit(r418Fix2Regression.status || 1);
}
if (r418Fix2Output) console.log(r418Fix2Output);
console.log('R151 aprovado: toda a pasta src passou no contrato TypeScript autocontido do pacote limpo.');
