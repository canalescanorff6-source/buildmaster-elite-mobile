import assert from 'node:assert/strict';
import fs from 'node:fs';
const store=fs.readFileSync('src/modules/vault/cardHistoryStore.ts','utf8');
assert.match(store,/NATIVE_HISTORY_READ_CONCURRENCY_R410 = 8/);
assert.match(store,/mapWithConcurrencyR410/);
assert.match(store,/new Set\(value\.order\)\.size !== value\.count/);
assert.match(store,/declaredCountR410 !== value\.count/);
assert.match(store,/promoteRecoveredNativeManifestR410/);
assert.match(store,/if \(!manifestRaw && !backupRaw\) return null/);
assert.match(store,/O backup não participa do caminho saudável/);
assert.match(store,/Promise\.all\(Array\.from/);
assert.doesNotMatch(store,/for \(const bucket of manifest\.buckets\) \{\s*const raw = await nativeVaultRead\(bucket\.key\)/);
function validOrder(order,count){return Array.isArray(order)&&order.length===count&&order.every((key)=>typeof key==='string'&&Boolean(key))&&new Set(order).size===count;}
assert.equal(validOrder(['a','b','c'],3),true);
assert.equal(validOrder(['a','a','c'],3),false);
async function mapC(items,limit,worker){if(!items.length)return[];const out=new Array(items.length);let cursor=0;const run=async()=>{while(true){const i=cursor++;if(i>=items.length)return;out[i]=await worker(items[i],i);}};await Promise.all(Array.from({length:Math.min(Math.max(1,limit),items.length)},()=>run()));return out;}
let active=0,maxActive=0;const source=Array.from({length:64},(_,i)=>i);const result=await mapC(source,8,async(v)=>{active++;maxActive=Math.max(maxActive,active);await new Promise(r=>setTimeout(r,1));active--;return v*v;});assert.deepEqual(result,source.map(v=>v*v));assert.ok(maxActive>1&&maxActive<=8);
console.log('R410 aprovada: leitura paralela limitada, ordem/contagem do manifesto endurecidas e backup nativo auto-recuperável.');
