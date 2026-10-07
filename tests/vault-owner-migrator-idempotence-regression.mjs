import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {applyShardedNativeVaultR409} from '../scripts/apply-r409-sharded-native-vault.mjs';
import {applyFastResilientVaultReadR410} from '../scripts/apply-r410-fast-resilient-vault-read.mjs';
import {applyCrashSafeVaultCommitR411} from '../scripts/apply-r411-crash-safe-vault-commit.mjs';
import {applyBoundedVaultHydrationR412} from '../scripts/apply-r412-bounded-vault-hydration.mjs';

const root=fs.mkdtempSync(path.join(os.tmpdir(),'vault-owner-migrators-'));
try {
  const relative='src/modules/vault/cardHistoryStore.ts',source=fs.readFileSync(relative,'utf8');
  fs.mkdirSync(path.join(root,'src/modules/vault'),{recursive:true});
  fs.mkdirSync(path.join(root,'tests'));
  fs.writeFileSync(path.join(root,relative),source);
  fs.writeFileSync(path.join(root,'package.json'),JSON.stringify({scripts:{'test:r200':'node tests/placeholder.mjs'}}));
  for(let pass=0;pass<2;pass++) {
    for(const migrate of [applyShardedNativeVaultR409,applyFastResilientVaultReadR410,applyCrashSafeVaultCommitR411,applyBoundedVaultHydrationR412]) migrate(root);
    assert.equal(fs.readFileSync(path.join(root,relative),'utf8'),source,'A preparação de build precisa preservar o gravador com conta fixada, incluindo todos os guards.');
  }
  for(const name of fs.readdirSync(path.join(root,'tests'))) {
    const result=spawnSync(process.execPath,[path.join(root,'tests',name)],{cwd:root,encoding:'utf8'});
    assert.equal(result.status,0,`${name}: ${result.stdout}${result.stderr}`);
  }
  console.log('Preparação R409–R412: idempotência, isolamento de conta e contratos de commit preservados.');
} finally {fs.rmSync(root,{recursive:true,force:true});}
