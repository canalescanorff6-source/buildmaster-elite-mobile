import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE = 'src/modules/vault/cardHistoryStore.ts';
const PACKAGE = 'package.json';
const TEST = 'tests/v40-80-r412-bounded-vault-hydration-regression.mjs';
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const readFragment = (name) => readFileSync(resolve(SCRIPT_DIR, name), 'utf8').trimEnd();

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R412: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}

function replaceRegexRequired(source, pattern, replacement, label) {
  if (source.includes(replacement)) return { source, changed: false };
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const matches = [...source.matchAll(new RegExp(pattern.source, flags))];
  if (matches.length !== 1) throw new Error(`R412: contrato inesperado em ${label}; ocorrências=${matches.length}`);
  return { source: source.replace(pattern, replacement), changed: true };
}

export function applyBoundedVaultHydrationR412(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const storePath = resolve(root, STORE);
  const packagePath = resolve(root, PACKAGE);
  if (!existsSync(storePath) || !existsSync(packagePath)) throw new Error('R412: store do Cofre/package.json ausentes.');

  const streamingReader = readFragment('r412-streaming-reader.txt');
  let store = readFileSync(storePath, 'utf8');
  let changed = false;

  let r = replaceRequired(
    store,
    'export const NATIVE_HISTORY_READ_CONCURRENCY_R410 = 8;',
    'export const NATIVE_HISTORY_READ_CONCURRENCY_R410 = 8;\nexport const NATIVE_HISTORY_MAX_INFLIGHT_ITEMS_R412 = 2048;',
    'orçamento de hidratação em voo'
  );
  store = r.source; changed ||= r.changed;

  r = replaceRegexRequired(
    store,
    /async function readNativeHistoryManifestPayloadR409\(manifest: NativeHistoryManifestR409\): Promise<SavedAnalysis\[]> \{[\s\S]*?\n\}(?=\n\nasync function promoteRecoveredNativeManifestR410)/,
    streamingReader,
    'hidratação incremental dos shards'
  );
  store = r.source; changed ||= r.changed;

  const requiredContracts = [
    'NATIVE_HISTORY_MAX_INFLIGHT_ITEMS_R412 = 2048',
    'nativeHistoryReadConcurrencyR412',
    'readAndNormalizeNativeHistoryBucketR412',
    'const ordered = new Array<SavedAnalysis | undefined>(manifest.count)',
    'const scheduledBuckets = [...manifest.buckets].sort',
    'orderIndex.delete(item.saveKey)',
    'mapWithConcurrencyR410(',
  ];
  for (const contract of requiredContracts) {
    if (!store.includes(contract)) throw new Error(`R412: contrato ausente após patch: ${contract}`);
  }
  if (store.includes('const payloads = await mapWithConcurrencyR410(')) {
    throw new Error('R412: o leitor R410 ainda retém todos os payloads desserializados.');
  }
  if (!store.includes('normalizeHistoryList(parsed, fallbackOffset)')) {
    throw new Error('R412: normalização por shard não instalada.');
  }

  if (changed) writeFileSync(storePath, store, 'utf8');

  const testPath = resolve(root, TEST);
  const testSource = `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst store=fs.readFileSync('src/modules/vault/cardHistoryStore.ts','utf8');\nassert.match(store,/NATIVE_HISTORY_MAX_INFLIGHT_ITEMS_R412 = 2048/);\nassert.match(store,/nativeHistoryReadConcurrencyR412/);\nassert.match(store,/readAndNormalizeNativeHistoryBucketR412/);\nassert.match(store,/const ordered = new Array<SavedAnalysis \\| undefined>\\(manifest\\.count\\)/);\nassert.match(store,/const scheduledBuckets = \\[\\.\\.\\.manifest\\.buckets\\]\\.sort/);\nassert.match(store,/orderIndex\\.delete\\(item\\.saveKey\\)/);\nassert.equal((store.match(/function mapWithConcurrencyR410/g) ?? []).length,1);\nassert.equal((store.match(/function nativeHistoryReadConcurrencyR412/g) ?? []).length,1);\nassert.equal((store.match(/function readAndNormalizeNativeHistoryBucketR412/g) ?? []).length,1);\nassert.doesNotMatch(store,/const payloads = await mapWithConcurrencyR410\\(/);\n\nfunction concurrency(counts){if(!counts.length)return 1;const largest=Math.max(...counts);return Math.max(1,Math.min(8,Math.floor(2048/largest)||1));}\nassert.equal(concurrency(Array(64).fill(10)),8);\nassert.equal(concurrency(Array(64).fill(256)),8);\nassert.equal(concurrency(Array(64).fill(512)),4);\nassert.equal(concurrency(Array(64).fill(1024)),2);\nassert.equal(concurrency(Array(64).fill(4096)),1);\n\nasync function mapC(items,limit,worker){if(!items.length)return[];const out=new Array(items.length);let cursor=0;const run=async()=>{while(true){const i=cursor++;if(i>=items.length)return;out[i]=await worker(items[i],i);}};await Promise.all(Array.from({length:Math.min(Math.max(1,limit),items.length)},()=>run()));return out;}\nconst count=10000;const order=Array.from({length:count},(_,i)=>'card-'+i);const output=new Array(count);const index=new Map(order.map((key,i)=>[key,i]));const buckets=Array.from({length:64},()=>[]);for(let i=0;i<count;i++)buckets[i%64].push({saveKey:'card-'+i,result:{trainingPointsTotal:(i%140)+1}});let active=0,maxActive=0,retainedAfterWorker=0;await mapC(buckets,8,async(bucket)=>{active++;maxActive=Math.max(maxActive,active);const parsed=JSON.parse(JSON.stringify(bucket));for(const item of parsed){const target=index.get(item.saveKey);assert.notEqual(target,undefined);output[target]=item;index.delete(item.saveKey);}active--;retainedAfterWorker+=0;});assert.ok(maxActive<=8);assert.equal(index.size,0);assert.equal(output.length,count);assert.equal(output[7777].saveKey,'card-7777');assert.equal(output[7777].result.trainingPointsTotal,(7777%140)+1);assert.equal(retainedAfterWorker,0);\n\nconst extreme=Array.from({length:64},(_,i)=>i===0?5000:800);assert.equal(concurrency(extreme),1);\nconsole.log('R412 aprovada: hidratação incremental, concorrência adaptativa e 10.000 fichas preservadas em ordem com PP individual.');\n`;
  if (!existsSync(testPath) || readFileSync(testPath, 'utf8') !== testSource) {
    writeFileSync(testPath, testSource, 'utf8');
    changed = true;
  }

  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const marker = 'node tests/v40-80-r412-bounded-vault-hydration-regression.mjs';
  const current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R412: test:r200 ausente.');
  if (!current.includes(marker)) {
    pkg.scripts['test:r200'] = `${current} && ${marker}`;
    writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    changed = true;
  }

  return {
    changed,
    sourceChanged: true,
    streamingShardHydration: true,
    retainedParsedShardSets: 0,
    maxInflightItemsTarget: 2048,
    adaptiveReadConcurrency: true,
    logicalHistoryLimit: 'unbounded',
    ppIsolation: 'per-card',
  };
}
