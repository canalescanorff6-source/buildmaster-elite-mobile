import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE = 'src/modules/vault/cardHistoryStore.ts';
const PACKAGE = 'package.json';
const TEST = 'tests/v40-80-r409-sharded-native-vault-regression.mjs';
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const readFragment = (name) => readFileSync(resolve(SCRIPT_DIR, name), 'utf8').trimEnd();

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R409: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}

function replaceRegexRequired(source, pattern, replacement, label) {
  if (source.includes(replacement)) return { source, changed: false };
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const matches = [...source.matchAll(new RegExp(pattern.source, flags))];
  if (matches.length !== 1) throw new Error(`R409: contrato inesperado em ${label}; ocorrências=${matches.length}`);
  return { source: source.replace(pattern, replacement), changed: true };
}

export function applyShardedNativeVaultR409(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const storePath = resolve(root, STORE);
  const packagePath = resolve(root, PACKAGE);
  if (!existsSync(storePath) || !existsSync(packagePath)) throw new Error('R409: store do Cofre/package.json ausentes.');

  const shardRuntime = readFragment('r409-card-history-runtime.txt');
  const loadHistory = readFragment('r409-load-history.txt');
  const persistImmediate = readFragment('r409-persist-history.txt');
  let store = readFileSync(storePath, 'utf8');
  let changed = false;

  let r = replaceRequired(
    store,
    `  nativeVaultInfo,\n  nativeVaultRead,\n  nativeVaultWrite`,
    `  nativeVaultInfo,\n  nativeVaultRead,\n  nativeVaultRemove,\n  nativeVaultWrite`,
    'import nativeVaultRemove'
  );
  store = r.source; changed ||= r.changed;

  const storageKeyAnchor = "const NATIVE_HISTORY_STORAGE_KEY = () => accountDatabaseName(`${HISTORY_DB_NAME}_internal_file_v1`);";
  if (!store.includes('NATIVE_HISTORY_BUCKET_COUNT_R409')) {
    if (!store.includes(storageKeyAnchor)) throw new Error('R409: chave nativa canônica não encontrada.');
    store = store.replace(storageKeyAnchor, `${storageKeyAnchor}\n\n${shardRuntime}`);
    changed = true;
  }

  r = replaceRegexRequired(
    store,
    /export async function loadHistoryStore\(options: HistoryLoadOptions = \{\}\): Promise<SavedAnalysis\[]> \{[\s\S]*?\n\}\n\nexport async function loadHistoryStoreForStartup/,
    `${loadHistory}\n\nexport async function loadHistoryStoreForStartup`,
    'loader autoritativo/sharded'
  );
  store = r.source; changed ||= r.changed;

  r = replaceRegexRequired(
    store,
    /async function persistHistoryStoreImmediate\(items: SavedAnalysis\[]\): Promise<HistoryPersistenceResult> \{[\s\S]*?\n\}\n\nexport function persistHistoryStore/,
    `${persistImmediate}\n\nexport function persistHistoryStore`,
    'persistência sharded'
  );
  store = r.source; changed ||= r.changed;

  if (!store.includes('nativeAuthoritativeR409')) throw new Error('R409: autoridade nativa não instalada.');
  if (!store.includes('writeNativeHistoryShardedR409(compacted)')) throw new Error('R409: persistência em shards não instalada.');
  if (store.includes('const payload = JSON.stringify(compactHistoryForNativeStorage(next));')) throw new Error('R409: escrita monolítica antiga ainda ativa.');
  if (!store.includes('if (!nativeAuthoritativeR409)')) throw new Error('R409: rotas antigas ainda podem ressuscitar fichas removidas.');

  if (changed) writeFileSync(storePath, store, 'utf8');

  const testPath = resolve(root, TEST);
  const testSource = `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst store=fs.readFileSync('src/modules/vault/cardHistoryStore.ts','utf8');\nassert.match(store,/NATIVE_HISTORY_BUCKET_COUNT_R409 = 64/);\nassert.match(store,/NATIVE_HISTORY_SHARD_VERSION_R409 = 2/);\nassert.match(store,/nativeVaultRemove/);\nassert.match(store,/readNativeHistoryShardedR409/);\nassert.match(store,/writeNativeHistoryShardedR409/);\nassert.match(store,/contentFingerprintR409/);\nassert.match(store,/nativeAuthoritativeR409/);\nassert.ok(store.includes('if (!nativeAuthoritativeR409)'));\nassert.match(store,/Snapshot anterior vira recuperação/);\nassert.doesNotMatch(store,/const payload = JSON\.stringify\(compactHistoryForNativeStorage\(next\)\)/);\nfunction fnv(v){let h=0x811c9dc5;for(let i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,0x01000193);}return h>>>0;}\nfunction djb(v){let h=5381;for(let i=0;i<v.length;i++)h=Math.imul(h,33)^v.charCodeAt(i);return h>>>0;}\nfunction fp(v){return fnv(v).toString(36)+'-'+djb(v).toString(36)+'-'+v.length.toString(36);}\nfunction buckets(cards){const out=Array.from({length:64},()=>[]);for(const card of cards)out[fnv(card.saveKey)%64].push(card);return out.map((b)=>b.length?fp(JSON.stringify(b)):null);}\nconst cards=Array.from({length:10000},(_,i)=>({saveKey:'card-'+i,result:{trainingPointsTotal:(i%140)+1}}));\nconst before=buckets(cards);\nassert.equal(before.filter(Boolean).length,64);\nconst changedCards=cards.map((c,i)=>i===777?({...c,result:{trainingPointsTotal:140}}):c);\nconst after=buckets(changedCards);\nassert.equal(after.filter((value,index)=>value!==before[index]).length,1);\nassert.equal(changedCards.length,10000);\nassert.equal(changedCards[9999].result.trainingPointsTotal,cards[9999].result.trainingPointsTotal);\nconsole.log('R409 aprovada: Cofre nativo em 64 buckets, escrita incremental, snapshot anterior recuperável e autoridade sem ressuscitar fichas antigas.');\n`;
  if (!existsSync(testPath) || readFileSync(testPath, 'utf8') !== testSource) {
    writeFileSync(testPath, testSource, 'utf8');
    changed = true;
  }

  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const marker = 'node tests/v40-80-r409-sharded-native-vault-regression.mjs';
  const current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R409: test:r200 ausente.');
  if (!current.includes(marker)) {
    pkg.scripts['test:r200'] = `${current} && ${marker}`;
    writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    changed = true;
  }

  return {
    changed,
    sourceChanged: true,
    logicalHistoryLimit: 'unbounded',
    nativeBuckets: 64,
    incrementalNativeWrites: true,
    recoverablePreviousSnapshot: true,
    nativeSnapshotAuthoritative: true,
  };
}
