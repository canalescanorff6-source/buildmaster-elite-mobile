import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { applyR414CiContractConvergence } from './apply-r414-ci-contract-convergence.mjs';
import { applyR417Fix2StableVaultActionIdentity } from './apply-r417-fix2-stable-vault-action-identity.mjs';
import { applyR418UnboundedCapacity } from './apply-r418-unbounded-capacity.mjs';
import { applyR418Fix2HistoricalCapacityContracts } from './apply-r418-fix2-historical-contracts.mjs';
import { applyR419ReaderMasterEngineClosure } from './apply-r419-reader-master-engine-closure.mjs';
import { applyR420PersistenceRecoveryClosure } from './apply-r420-persistence-recovery-closure.mjs';
import { applyR421SquadVideoTacticalClosure } from './apply-r421-squad-video-tactical-closure.mjs';
import { applyR422SecurityObservabilityClosure } from './apply-r422-security-observability-closure.mjs';
import { applyR423AndroidPerformanceUxClosure } from './apply-r423-android-performance-ux-closure.mjs';
import { applyR425SupabaseSecurityChain } from './apply-r425-supabase-security-chain.mjs';
import { assertR426SupabaseForwardSecurityMigration } from './check-r426-supabase-forward-security-migration.mjs';
import { assertR424CodeClosure } from './audit-r424-final-requirements-closure.mjs';

function hasConvergedR417(projectRoot = process.cwd()) {
  const required = [
    ['src/lib/autonomousCardR417.ts', 'AUTONOMOUS_CARD_R417_VERSION'],
    ['src/lib/cardIntelligencePipeline.ts', 'applyAutonomousRoleSeedR417(current)'],
    ['src/lib/cleanSlatePerformance2027V4080R119.ts', 'usageContext.targetPosition !== autonomousPrimaryR417'],
  ];
  return required.every(([relative, fragment]) => {
    const file = path.resolve(projectRoot, relative);
    return fs.existsSync(file) && fs.readFileSync(file, 'utf8').includes(fragment);
  });
}

if (!hasConvergedR417()) {
  const r417 = applyR414CiContractConvergence();
  if (r417.changed) console.log(`R417 convergida antes do contrato TypeScript R151 (${r417.patched.length} arquivo(s)).`);
}

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
const r419 = applyR419ReaderMasterEngineClosure();
if (r419.changed) {
  console.log(`R419 convergiu leitor/Motor Mestre antes do R151 (${r419.patched.length} arquivo(s)).`);
}
const r420 = applyR420PersistenceRecoveryClosure();
if (r420.changed) {
  console.log(`R420 convergiu persistência/recuperação antes do R151 (${r420.patched.length} arquivo(s)).`);
}
const r421 = applyR421SquadVideoTacticalClosure();
if (r421.changed) {
  console.log(`R421 convergiu elenco/vídeo/Estúdio Tático antes do R151 (${r421.patched.length} arquivo(s)).`);
}
const r422 = applyR422SecurityObservabilityClosure();
if (r422.changed) {
  console.log(`R422 convergiu segurança/observabilidade antes do R151 (${r422.patched.length} arquivo(s)).`);
}
const r423 = applyR423AndroidPerformanceUxClosure();
if (r423.changed) {
  console.log(`R423 convergiu Android/performance/UX antes do R151 (${r423.patched.length} arquivo(s)).`);
}
const r425 = applyR425SupabaseSecurityChain();
if (r425.changed) {
  console.log(`R425 convergiu cadeia Supabase estática antes do R151 (${r425.patched.length} arquivo(s)).`);
}
const r426 = assertR426SupabaseForwardSecurityMigration();
console.log(`R426 validou migration forward-only antes do R151 (${r426.migration}).`);
const r424 = assertR424CodeClosure();
console.log(`R424 auditou fechamento estrutural antes do R151 (${r424.counts.ENTREGUE} requisito(s) de código entregues).`);

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
const r419Regression = spawnSync(process.execPath, ['tests/v40-80-r419-reader-master-engine-closure-regression.mjs'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});
const r419Output = `${r419Regression.stdout || ''}${r419Regression.stderr || ''}`.trim();
if (r419Regression.status !== 0) {
  console.error('R151/R419: contrato fail-closed do leitor/Motor Mestre falhou.');
  if (r419Output) console.error(r419Output);
  process.exit(r419Regression.status || 1);
}
if (r419Output) console.log(r419Output);
const r420Regression = spawnSync(process.execPath, ['tests/v40-80-r420-persistence-recovery-closure-regression.mjs'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});
const r420Output = `${r420Regression.stdout || ''}${r420Regression.stderr || ''}`.trim();
if (r420Regression.status !== 0) {
  console.error('R151/R420: contrato de persistência/recuperação sem perda falhou.');
  if (r420Output) console.error(r420Output);
  process.exit(r420Regression.status || 1);
}
if (r420Output) console.log(r420Output);
const r420Fix1Regression = spawnSync(process.execPath, ['tests/v40-80-r420-fix1-history-limit-normalization-regression.mjs'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});
const r420Fix1Output = `${r420Fix1Regression.stdout || ''}${r420Fix1Regression.stderr || ''}`.trim();
if (r420Fix1Regression.status !== 0) {
  console.error('R151/R420-fix1: normalização semântica do HISTORY_LIMIT_R200 falhou.');
  if (r420Fix1Output) console.error(r420Fix1Output);
  process.exit(r420Fix1Regression.status || 1);
}
if (r420Fix1Output) console.log(r420Fix1Output);
const r421Regression = spawnSync(process.execPath, ['tests/v40-80-r421-squad-video-tactical-closure-regression.mjs'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});
const r421Output = `${r421Regression.stdout || ''}${r421Regression.stderr || ''}`.trim();
if (r421Regression.status !== 0) {
  console.error('R151/R421: contrato de elenco, vídeo revisável e Estúdio Tático falhou.');
  if (r421Output) console.error(r421Output);
  process.exit(r421Regression.status || 1);
}
if (r421Output) console.log(r421Output);
const r422Regression = spawnSync(process.execPath, ['tests/v40-80-r422-security-observability-closure-regression.mjs'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});
const r422Output = `${r422Regression.stdout || ''}${r422Regression.stderr || ''}`.trim();
if (r422Regression.status !== 0) {
  console.error('R151/R422: contrato de segurança/observabilidade falhou.');
  if (r422Output) console.error(r422Output);
  process.exit(r422Regression.status || 1);
}
if (r422Output) console.log(r422Output);
const r423Regression = spawnSync(process.execPath, ['tests/v40-80-r423-android-performance-ux-closure-regression.mjs'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});
const r423Output = `${r423Regression.stdout || ''}${r423Regression.stderr || ''}`.trim();
if (r423Regression.status !== 0) {
  console.error('R151/R423: contrato Android/performance/UX falhou.');
  if (r423Output) console.error(r423Output);
  process.exit(r423Regression.status || 1);
}
if (r423Output) console.log(r423Output);
const r426Regression = spawnSync(process.execPath, ['tests/v40-80-r426-supabase-forward-security-migration-regression.mjs'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});
const r426Output = `${r426Regression.stdout || ''}${r426Regression.stderr || ''}`.trim();
if (r426Regression.status !== 0) {
  console.error('R151/R426: migration forward-only de segurança do Supabase falhou.');
  if (r426Output) console.error(r426Output);
  process.exit(r426Regression.status || 1);
}
if (r426Output) console.log(r426Output);
const r424Regression = spawnSync(process.execPath, ['tests/v40-80-r424-final-requirements-closure-regression.mjs'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});
const r424Output = `${r424Regression.stdout || ''}${r424Regression.stderr || ''}`.trim();
if (r424Regression.status !== 0) {
  console.error('R151/R424: auditoria final de requisitos falhou.');
  if (r424Output) console.error(r424Output);
  process.exit(r424Regression.status || 1);
}
if (r424Output) console.log(r424Output);
const r425Regression = spawnSync(process.execPath, ['tests/v40-80-r425-supabase-security-chain-regression.mjs'], {
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'pipe']
});
const r425Output = `${r425Regression.stdout || ''}${r425Regression.stderr || ''}`.trim();
if (r425Regression.status !== 0) {
  console.error('R151/R425: cadeia Supabase estática fail-closed falhou.');
  if (r425Output) console.error(r425Output);
  process.exit(r425Regression.status || 1);
}
if (r425Output) console.log(r425Output);
console.log('R151 aprovado: toda a pasta src passou no contrato TypeScript autocontido do pacote limpo.');
