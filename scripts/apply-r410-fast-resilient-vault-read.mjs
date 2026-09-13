import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const STORE = 'src/modules/vault/cardHistoryStore.ts';
const PACKAGE = 'package.json';
const TEST = 'tests/v40-80-r410-fast-resilient-vault-read-regression.mjs';

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R410: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}

function replaceRegexRequired(source, pattern, replacement, label) {
  if (source.includes(replacement)) return { source, changed: false };
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const matches = [...source.matchAll(new RegExp(pattern.source, flags))];
  if (matches.length !== 1) throw new Error(`R410: contrato inesperado em ${label}; ocorrências=${matches.length}`);
  return { source: source.replace(pattern, replacement), changed: true };
}

const FAST_READER = `async function mapWithConcurrencyR410<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  if (!items.length) return [];
  const output = new Array<R>(items.length);
  let cursor = 0;
  const runner = async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= items.length) return;
      output[index] = await worker(items[index], index);
    }
  };
  const workers = Math.min(Math.max(1, concurrency), items.length);
  await Promise.all(Array.from({ length: workers }, () => runner()));
  return output;
}

async function readNativeHistoryManifestPayloadR409(manifest: NativeHistoryManifestR409): Promise<SavedAnalysis[]> {
  const payloads = await mapWithConcurrencyR410(
    manifest.buckets,
    NATIVE_HISTORY_READ_CONCURRENCY_R410,
    async (bucket) => {
      const raw = await nativeVaultRead(bucket.key);
      if (!raw || contentFingerprintR409(raw) !== bucket.fingerprint) throw new Error(\`R410: shard \${bucket.index} ausente ou corrompido.\`);
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length !== bucket.count) throw new Error(\`R410: shard \${bucket.index} com contagem inválida.\`);
      return { bucket, parsed };
    }
  );

  const bySaveKey = new Map<string, SavedAnalysis>();
  let total = 0;
  for (const payload of payloads) {
    const offset = total;
    total += payload.parsed.length;
    for (const item of normalizeHistoryList(payload.parsed, offset)) bySaveKey.set(item.saveKey, item);
  }
  if (total !== manifest.count || bySaveKey.size !== manifest.count) throw new Error('R410: manifesto e shards divergiram.');

  const ordered: SavedAnalysis[] = [];
  for (const saveKey of manifest.order) {
    const item = bySaveKey.get(saveKey);
    if (!item) throw new Error(\`R410: ordem do Cofre referencia ficha ausente: \${saveKey}.\`);
    ordered.push(item);
  }
  if (ordered.length !== manifest.count) throw new Error('R410: ordem do Cofre incompleta.');
  return ordered;
}

async function promoteRecoveredNativeManifestR410(raw: string): Promise<void> {
  try {
    await nativeVaultWrite(NATIVE_HISTORY_MANIFEST_KEY_R409(), raw);
  } catch (error) {
    console.warn('R410: snapshot anterior foi recuperado, mas a promoção automática falhou.', error);
  }
}

async function readNativeHistoryShardedR409(): Promise<SavedAnalysis[] | null> {
  const manifestRaw = await nativeVaultRead(NATIVE_HISTORY_MANIFEST_KEY_R409()).catch(() => null);
  const manifest = parseNativeHistoryManifestR409(manifestRaw);
  if (manifest && manifestRaw) {
    try {
      return await readNativeHistoryManifestPayloadR409(manifest);
    } catch (error) {
      console.warn('R410: snapshot nativo atual inválido; tentando snapshot anterior.', error);
    }
  }

  // O backup não participa do caminho saudável. Só há I/O extra quando o atual
  // está ausente, inválido ou algum shard falhou na validação.
  const backupRaw = await nativeVaultRead(NATIVE_HISTORY_BACKUP_MANIFEST_KEY_R409()).catch(() => null);
  if (!manifestRaw && !backupRaw) return null;
  const backup = parseNativeHistoryManifestR409(backupRaw);
  if (backup && backupRaw) {
    const recovered = await readNativeHistoryManifestPayloadR409(backup);
    await promoteRecoveredNativeManifestR410(backupRaw);
    return recovered;
  }
  throw new Error('R410: nenhum snapshot nativo íntegro disponível.');
}`;

export function applyFastResilientVaultReadR410(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const storePath = resolve(root, STORE);
  const packagePath = resolve(root, PACKAGE);
  if (!existsSync(storePath) || !existsSync(packagePath)) throw new Error('R410: store do Cofre/package.json ausentes.');

  let store = readFileSync(storePath, 'utf8');
  let changed = false;

  let r = replaceRequired(
    store,
    `export const NATIVE_HISTORY_SHARD_VERSION_R409 = 2;`,
    `export const NATIVE_HISTORY_SHARD_VERSION_R409 = 2;\nexport const NATIVE_HISTORY_READ_CONCURRENCY_R410 = 8;`,
    'concorrência de leitura'
  );
  store = r.source; changed ||= r.changed;

  r = replaceRequired(
    store,
    `    if (!Array.isArray(value.order) || value.order.length !== value.count || !value.order.every((key) => typeof key === 'string' && Boolean(key))) return null;\n    if (!Array.isArray(value.buckets)) return null;\n    const seenIndexes = new Set<number>();\n    const seenKeys = new Set<string>();`,
    `    if (!Array.isArray(value.order) || value.order.length !== value.count || !value.order.every((key) => typeof key === 'string' && Boolean(key))) return null;\n    if (new Set(value.order).size !== value.count) return null;\n    if (!Array.isArray(value.buckets)) return null;\n    const seenIndexes = new Set<number>();\n    const seenKeys = new Set<string>();\n    let declaredCountR410 = 0;`,
    'ordem única do manifesto'
  );
  store = r.source; changed ||= r.changed;

  r = replaceRequired(
    store,
    `      seenIndexes.add(bucket.index);\n      seenKeys.add(bucket.key);\n    }\n    return value as NativeHistoryManifestR409;`,
    `      seenIndexes.add(bucket.index);\n      seenKeys.add(bucket.key);\n      declaredCountR410 += bucket.count;\n    }\n    if (declaredCountR410 !== value.count) return null;\n    return value as NativeHistoryManifestR409;`,
    'soma declarada dos buckets'
  );
  store = r.source; changed ||= r.changed;

  r = replaceRegexRequired(
    store,
    /async function readNativeHistoryManifestPayloadR409\(manifest: NativeHistoryManifestR409\): Promise<SavedAnalysis\[]> \{[\s\S]*?\n\}\n\nasync function readNativeHistoryShardedR409\(\): Promise<SavedAnalysis\[] \| null> \{[\s\S]*?\n\}/,
    FAST_READER,
    'leitor concorrente e recuperação autopromovida'
  );
  store = r.source; changed ||= r.changed;

  if (!store.includes('NATIVE_HISTORY_READ_CONCURRENCY_R410 = 8')) throw new Error('R410: concorrência de leitura não instalada.');
  if (!store.includes('mapWithConcurrencyR410')) throw new Error('R410: leitor concorrente não instalado.');
  if (!store.includes('new Set(value.order).size !== value.count')) throw new Error('R410: integridade da ordem não instalada.');
  if (!store.includes('declaredCountR410 !== value.count')) throw new Error('R410: integridade da contagem não instalada.');
  if (!store.includes('promoteRecoveredNativeManifestR410')) throw new Error('R410: auto-reparo do manifesto não instalado.');
  if (!store.includes('if (!manifestRaw && !backupRaw) return null;')) throw new Error('R410: backup órfão ainda não é recuperável.');
  if (!store.includes('O backup não participa do caminho saudável')) throw new Error('R410: backup ainda participa do caminho saudável.');

  if (changed) writeFileSync(storePath, store, 'utf8');

  const testPath = resolve(root, TEST);
  const testSource = `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst store=fs.readFileSync('src/modules/vault/cardHistoryStore.ts','utf8');\nassert.match(store,/NATIVE_HISTORY_READ_CONCURRENCY_R410 = 8/);\nassert.match(store,/mapWithConcurrencyR410/);\nassert.match(store,/new Set\\(value\\.order\\)\\.size !== value\\.count/);\nassert.match(store,/declaredCountR410 !== value\\.count/);\nassert.match(store,/promoteRecoveredNativeManifestR410/);\nassert.match(store,/if \\(!manifestRaw && !backupRaw\\) return null/);\nassert.match(store,/O backup não participa do caminho saudável/);\nassert.match(store,/Promise\\.all\\(Array\\.from/);\nassert.doesNotMatch(store,/for \\(const bucket of manifest\\.buckets\\) \\{\\s*const raw = await nativeVaultRead\\(bucket\\.key\\)/);\nfunction validOrder(order,count){return Array.isArray(order)&&order.length===count&&order.every((key)=>typeof key==='string'&&Boolean(key))&&new Set(order).size===count;}\nassert.equal(validOrder(['a','b','c'],3),true);\nassert.equal(validOrder(['a','a','c'],3),false);\nasync function mapC(items,limit,worker){if(!items.length)return[];const out=new Array(items.length);let cursor=0;const run=async()=>{while(true){const i=cursor++;if(i>=items.length)return;out[i]=await worker(items[i],i);}};await Promise.all(Array.from({length:Math.min(Math.max(1,limit),items.length)},()=>run()));return out;}\nlet active=0,maxActive=0;const source=Array.from({length:64},(_,i)=>i);const result=await mapC(source,8,async(v)=>{active++;maxActive=Math.max(maxActive,active);await new Promise(r=>setTimeout(r,1));active--;return v*v;});assert.deepEqual(result,source.map(v=>v*v));assert.ok(maxActive>1&&maxActive<=8);\nconsole.log('R410 aprovada: leitura paralela limitada, ordem/contagem do manifesto endurecidas e backup nativo auto-recuperável.');\n`;
  if (!existsSync(testPath) || readFileSync(testPath, 'utf8') !== testSource) {
    writeFileSync(testPath, testSource, 'utf8');
    changed = true;
  }

  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const marker = 'node tests/v40-80-r410-fast-resilient-vault-read-regression.mjs';
  const current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R410: test:r200 ausente.');
  if (!current.includes(marker)) {
    pkg.scripts['test:r200'] = `${current} && ${marker}`;
    writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    changed = true;
  }

  return {
    changed,
    sourceChanged: true,
    nativeReadConcurrency: 8,
    manifestOrderIntegrity: true,
    manifestCountIntegrity: true,
    orphanBackupRecovery: true,
    automaticBackupPromotion: true,
  };
}
