import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {applyShardedNativeVaultR409} from '../scripts/apply-r409-sharded-native-vault.mjs';
import {applyFastResilientVaultReadR410} from '../scripts/apply-r410-fast-resilient-vault-read.mjs';
import {applyCrashSafeVaultCommitR411} from '../scripts/apply-r411-crash-safe-vault-commit.mjs';
import {applyBoundedVaultHydrationR412} from '../scripts/apply-r412-bounded-vault-hydration.mjs';
import {applyR420PersistenceRecoveryClosure} from '../scripts/apply-r420-persistence-recovery-closure.mjs';
import {applyR427BuildPipelineRepair} from '../scripts/apply-r427-build-pipeline-repair.mjs';
import {sanitizeUpdateSource} from '../scripts/sanitize-update-source.mjs';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'vault-owner-migrators-'));
try {
  const relative='src/modules/vault/cardHistoryStore.ts',source=fs.readFileSync(relative,'utf8');
  fs.mkdirSync(path.join(root,'src/modules/vault'),{recursive:true});
  fs.mkdirSync(path.join(root,'tests'));
  fs.writeFileSync(path.join(root,relative),source);
  const backupFiles=['src/modules/vault/cardHistoryStartupModelR200.ts','src/modules/backup/cardVisionBackupRuntimeR162.ts','src/lib/dataSafety.ts','scripts/install-native-vault-storage-plugin.mjs','scripts/apply-r407-scalable-vault-capacity.mjs','scripts/apply-r420-persistence-recovery-closure.mjs'];
  const originals=new Map(backupFiles.map(file=>[file,fs.readFileSync(file,'utf8')]));
  for(const [file,original] of originals) {
    fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});
    fs.writeFileSync(path.join(root,file),original);
  }
  fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({scripts:{'test:r200':'node tests/placeholder.mjs'}}));
  for(let pass=0;pass<2;pass++) {
    for(const migrate of [applyShardedNativeVaultR409,applyFastResilientVaultReadR410,applyCrashSafeVaultCommitR411,applyBoundedVaultHydrationR412,applyR427BuildPipelineRepair,applyR420PersistenceRecoveryClosure]) migrate(root);
    assert.equal(fs.readFileSync(path.join(root,relative),'utf8'),source,'A preparação de build precisa preservar o gravador com conta fixada, incluindo todos os guards.');
    for(const [file,original] of originals) assert.equal(fs.readFileSync(path.join(root,file),'utf8'),original,`${file}: a preparação precisa preservar os imports e a restauração com conta fixada.`);
  }
  for(const name of fs.readdirSync(path.join(root,'tests'))) {
    const result=spawnSync(process.execPath,[path.join(root,'tests',name)],{cwd:root,encoding:'utf8'});
    assert.equal(result.status,0,`${name}: ${result.stdout}${result.stderr}`);
  }
  console.log('Preparação R409–R412/R420: idempotência, isolamento de conta, imports e contratos de commit preservados.');
} finally {fs.rmSync(root,{recursive:true,force:true});}

// Exercise the complete real sanitizer, including the older scripts that
// rewrite other convergers. Individual migrators are not enough to prove this.
const fullRoot=fs.mkdtempSync(path.join(os.tmpdir(),'app-prepare-migrators-'));
try {
  for(const relative of ['src','scripts','tests','.github','docs','package.json']) fs.cpSync(relative,path.join(fullRoot,relative),{recursive:true});
  const critical=['src/lib/cleanSlatePerformance2027V4080R119.ts','src/modules/vault/cardHistoryStore.ts','src/modules/backup/cardVisionBackupRuntimeR162.ts','scripts/apply-r420-persistence-recovery-closure.mjs'];
  const originals=new Map(critical.map(file=>[file,fs.readFileSync(path.join(fullRoot,file),'utf8')]));
  for(let pass=0;pass<2;pass++) {
    sanitizeUpdateSource(fullRoot);
    applyR420PersistenceRecoveryClosure(fullRoot);
    for(const [file,original] of originals) assert.ok(fs.readFileSync(path.join(fullRoot,file),'utf8')===original,`${file}: sanitize completo e R420 precisam preservar o motor revisado e os gravadores protegidos.`);
  }
  console.log('Sanitize completo/R420: versão e fingerprint R550, imports e guards preservados em duas preparações.');
} finally {fs.rmSync(fullRoot,{recursive:true,force:true});}
