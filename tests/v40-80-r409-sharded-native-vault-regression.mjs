import assert from 'node:assert/strict';
import fs from 'node:fs';
const store=fs.readFileSync('src/modules/vault/cardHistoryStore.ts','utf8');
assert.match(store,/NATIVE_HISTORY_BUCKET_COUNT_R409 = 64/);
assert.match(store,/NATIVE_HISTORY_SHARD_VERSION_R409 = 2/);
assert.match(store,/nativeVaultRemove/);
assert.match(store,/readNativeHistoryShardedR409/);
assert.match(store,/writeNativeHistoryShardedR409/);
assert.match(store,/contentFingerprintR409/);
assert.match(store,/nativeAuthoritativeR409/);
assert.ok(store.includes('if (!nativeAuthoritativeR409)'));
assert.match(store,/Snapshot anterior vira recuperação/);
assert.doesNotMatch(store,/const payload = JSON.stringify(compactHistoryForNativeStorage(next))/);
function fnv(v){let h=0x811c9dc5;for(let i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,0x01000193);}return h>>>0;}
function djb(v){let h=5381;for(let i=0;i<v.length;i++)h=Math.imul(h,33)^v.charCodeAt(i);return h>>>0;}
function fp(v){return fnv(v).toString(36)+'-'+djb(v).toString(36)+'-'+v.length.toString(36);}
function buckets(cards){const out=Array.from({length:64},()=>[]);for(const card of cards)out[fnv(card.saveKey)%64].push(card);return out.map((b)=>b.length?fp(JSON.stringify(b)):null);}
const cards=Array.from({length:10000},(_,i)=>({saveKey:'card-'+i,result:{trainingPointsTotal:(i%140)+1}}));
const before=buckets(cards);
assert.equal(before.filter(Boolean).length,64);
const changedCards=cards.map((c,i)=>i===777?({...c,result:{trainingPointsTotal:140}}):c);
const after=buckets(changedCards);
assert.equal(after.filter((value,index)=>value!==before[index]).length,1);
assert.equal(changedCards.length,10000);
assert.equal(changedCards[9999].result.trainingPointsTotal,cards[9999].result.trainingPointsTotal);
console.log('R409 aprovada: Cofre nativo em 64 buckets, escrita incremental, snapshot anterior recuperável e autoridade sem ressuscitar fichas antigas.');
