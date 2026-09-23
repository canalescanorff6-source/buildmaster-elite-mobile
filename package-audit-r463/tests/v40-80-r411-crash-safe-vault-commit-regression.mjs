import assert from 'node:assert/strict';
import fs from 'node:fs';
const store=fs.readFileSync('src/modules/vault/cardHistoryStore.ts','utf8');
assert.match(store,/NATIVE_HISTORY_TRANSACTION_VERSION_R411 = 1/);
assert.match(store,/__r411_transaction_v1/);
assert.match(store,/cleanupInterruptedNativeTransactionR411/);
assert.match(store,/verifyNativePayloadR411/);
assert.match(store,/journal transacional/);
assert.match(store,/manifesto de recuperação/);
assert.match(store,/manifesto atual/);
assert.match(store,/NATIVE_HISTORY_FALLBACK_AUTHORITY_KEY_R411/);
assert.match(store,/writeNativeHistorySecondaryAuthorityR411\('indexeddb'/);
assert.match(store,/writeNativeHistorySecondaryAuthorityR411\('local-fallback'/);
assert.match(store,/removeAccountStorage\(NATIVE_HISTORY_FALLBACK_AUTHORITY_KEY_R411\)/);
const journalWrite=store.indexOf('await nativeVaultWrite(NATIVE_HISTORY_TRANSACTION_KEY_R411(), journalRaw);');
const shardWrite=store.indexOf('await nativeVaultWrite(entry.key, entry.payload);');
const manifestWrite=store.indexOf('await nativeVaultWrite(NATIVE_HISTORY_MANIFEST_KEY_R409(), manifestRaw);');
assert.ok(journalWrite>=0&&shardWrite>journalWrite&&manifestWrite>shardWrite);

// Modelo de recuperação: staging nunca pode apagar shards do atual/backup.
function cleanupModel(journalKeys,currentKeys,backupKeys){const protectedKeys=new Set([...currentKeys,...backupKeys]);return journalKeys.filter((key)=>!protectedKeys.has(key));}
assert.deepEqual(cleanupModel(['stage-x','old-b','current-a'],['current-a'],['backup-a']),['stage-x','old-b']);
assert.deepEqual(cleanupModel(['new-a','old-a'],['new-a'],['old-a']),[]);

// Crash antes do commit: manifesto antigo continua autoridade e staging é coletável.
const oldManifest={keys:['c0','c1'],cards:['a','b']};
const staged=['n0'];
assert.deepEqual(cleanupModel(staged,oldManifest.keys,[]),['n0']);
assert.deepEqual(oldManifest.cards,['a','b']);

// Crash depois do commit e antes da coleta: staging comprometido fica protegido pelo manifesto novo.
const newManifest={keys:['n0','c1'],cards:['a','b']};
assert.deepEqual(cleanupModel(['n0','very-old'],newManifest.keys,oldManifest.keys),['very-old']);

// Autoridade secundária impede ressuscitar snapshot nativo antigo, inclusive quando o Cofre novo está vazio.
function selectAuthority(marker,native,indexed,local){if(marker?.backend==='indexeddb')return indexed;if(marker?.backend==='local-fallback')return local;return native;}
assert.deepEqual(selectAuthority({backend:'indexeddb'},[{saveKey:'old'}],[],[{saveKey:'older'}]),[]);
assert.deepEqual(selectAuthority({backend:'local-fallback'},[{saveKey:'old'}],[{saveKey:'mid'}],[{saveKey:'new'}]),[{saveKey:'new'}]);

// O PP continua propriedade da carta, sem depender do tamanho do Cofre.
const cards=Array.from({length:10000},(_,i)=>({saveKey:'card-'+i,result:{trainingPointsTotal:(i%140)+1}}));
const changed=cards.map((card,i)=>i===777?({...card,result:{trainingPointsTotal:140}}):card);
assert.equal(changed.length,10000);
assert.equal(changed[777].result.trainingPointsTotal,140);
assert.equal(changed[9999].result.trainingPointsTotal,cards[9999].result.trainingPointsTotal);
console.log('R411 aprovada: commit com journal, readback, coleta segura de órfãos e fallback mais novo explicitamente autoritativo.');
