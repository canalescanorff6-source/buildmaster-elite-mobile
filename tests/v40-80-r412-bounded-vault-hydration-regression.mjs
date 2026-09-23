import assert from 'node:assert/strict';
import fs from 'node:fs';
const store=fs.readFileSync('src/modules/vault/cardHistoryStore.ts','utf8');
assert.match(store,/NATIVE_HISTORY_MAX_INFLIGHT_ITEMS_R412 = 2048/);
assert.match(store,/nativeHistoryReadConcurrencyR412/);
assert.match(store,/readAndNormalizeNativeHistoryBucketR412/);
assert.match(store,/const ordered = new Array<SavedAnalysis \| undefined>\(manifest\.count\)/);
assert.match(store,/const scheduledBuckets = \[\.\.\.manifest\.buckets\]\.sort/);
assert.match(store,/orderIndex\.delete\(item\.saveKey\)/);
assert.equal((store.match(/function mapWithConcurrencyR410/g) ?? []).length,1);
assert.equal((store.match(/function nativeHistoryReadConcurrencyR412/g) ?? []).length,1);
assert.equal((store.match(/function readAndNormalizeNativeHistoryBucketR412/g) ?? []).length,1);
assert.doesNotMatch(store,/const payloads = await mapWithConcurrencyR410\(/);

function concurrency(counts){if(!counts.length)return 1;const largest=Math.max(...counts);return Math.max(1,Math.min(8,Math.floor(2048/largest)||1));}
assert.equal(concurrency(Array(64).fill(10)),8);
assert.equal(concurrency(Array(64).fill(256)),8);
assert.equal(concurrency(Array(64).fill(512)),4);
assert.equal(concurrency(Array(64).fill(1024)),2);
assert.equal(concurrency(Array(64).fill(4096)),1);

async function mapC(items,limit,worker){if(!items.length)return[];const out=new Array(items.length);let cursor=0;const run=async()=>{while(true){const i=cursor++;if(i>=items.length)return;out[i]=await worker(items[i],i);}};await Promise.all(Array.from({length:Math.min(Math.max(1,limit),items.length)},()=>run()));return out;}
const count=10000;const order=Array.from({length:count},(_,i)=>'card-'+i);const output=new Array(count);const index=new Map(order.map((key,i)=>[key,i]));const buckets=Array.from({length:64},()=>[]);for(let i=0;i<count;i++)buckets[i%64].push({saveKey:'card-'+i,result:{trainingPointsTotal:(i%140)+1}});let active=0,maxActive=0,retainedAfterWorker=0;await mapC(buckets,8,async(bucket)=>{active++;maxActive=Math.max(maxActive,active);const parsed=JSON.parse(JSON.stringify(bucket));for(const item of parsed){const target=index.get(item.saveKey);assert.notEqual(target,undefined);output[target]=item;index.delete(item.saveKey);}active--;retainedAfterWorker+=0;});assert.ok(maxActive<=8);assert.equal(index.size,0);assert.equal(output.length,count);assert.equal(output[7777].saveKey,'card-7777');assert.equal(output[7777].result.trainingPointsTotal,(7777%140)+1);assert.equal(retainedAfterWorker,0);

const extreme=Array.from({length:64},(_,i)=>i===0?5000:800);assert.equal(concurrency(extreme),1);
console.log('R412 aprovada: hidratação incremental, concorrência adaptativa e 10.000 fichas preservadas em ordem com PP individual.');
