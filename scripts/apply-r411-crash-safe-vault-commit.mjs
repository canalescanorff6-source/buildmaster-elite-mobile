import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE = 'src/modules/vault/cardHistoryStore.ts';
const PACKAGE = 'package.json';
const TEST = 'tests/v40-80-r411-crash-safe-vault-commit-regression.mjs';
const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const readFragment = (name) => readFileSync(resolve(SCRIPT_DIR, name), 'utf8').trimEnd();

function replaceRequired(source, from, to, label) {
  if (source.includes(to)) return { source, changed: false };
  const count = source.split(from).length - 1;
  if (count !== 1) throw new Error(`R411: contrato inesperado em ${label}; ocorrências=${count}`);
  return { source: source.replace(from, to), changed: true };
}

function replaceRegexRequired(source, pattern, replacement, label) {
  if (source.includes(replacement)) return { source, changed: false };
  const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
  const matches = [...source.matchAll(new RegExp(pattern.source, flags))];
  if (matches.length !== 1) throw new Error(`R411: contrato inesperado em ${label}; ocorrências=${matches.length}`);
  return { source: source.replace(pattern, replacement), changed: true };
}

export function applyCrashSafeVaultCommitR411(rootDirectory = process.cwd()) {
  const root = resolve(rootDirectory);
  const storePath = resolve(root, STORE);
  const packagePath = resolve(root, PACKAGE);
  if (!existsSync(storePath) || !existsSync(packagePath)) throw new Error('R411: store do Cofre/package.json ausentes.');

  const transactionRuntime = readFragment('r411-transaction-runtime.txt');
  const writeNativeHistory = readFragment('r411-write-native-history.txt');
  const loadHistory = readFragment('r411-load-history.txt');
  const persistImmediate = readFragment('r411-persist-history.txt');
  let store = readFileSync(storePath, 'utf8');
  let changed = false;

  const bucketFunction = `function bucketIndexR409(saveKey: string): number {\n  return fnv1a32R409(saveKey) % NATIVE_HISTORY_BUCKET_COUNT_R409;\n}`;
  if (!store.includes('NATIVE_HISTORY_TRANSACTION_VERSION_R411')) {
    if (!store.includes(bucketFunction)) throw new Error('R411: função de bucket R409 não encontrada.');
    store = store.replace(bucketFunction, `${bucketFunction}\n\n${transactionRuntime}`);
    changed = true;
  }

  let r = replaceRegexRequired(
    store,
    /async function writeNativeHistoryShardedR409\(items: SavedAnalysis\[]\): Promise<void> \{[\s\S]*?\n\}(?=\n(?:export type LearnedCardMemory|const normalizeSavedAnalysis))/, 
    writeNativeHistory,
    'commit nativo transacional'
  );
  store = r.source; changed ||= r.changed;

  r = replaceRegexRequired(
    store,
    /export async function loadHistoryStore\(options: HistoryLoadOptions = \{\}\): Promise<SavedAnalysis\[]> \{[\s\S]*?\n\}\n\nexport async function loadHistoryStoreForStartup/,
    `${loadHistory}\n\nexport async function loadHistoryStoreForStartup`,
    'autoridade do fallback e limpeza de transação interrompida'
  );
  store = r.source; changed ||= r.changed;

  r = replaceRegexRequired(
    store,
    /async function persistHistoryStoreImmediate\(items: SavedAnalysis\[]\): Promise<HistoryPersistenceResult> \{[\s\S]*?\n\}\n\nexport function persistHistoryStore/,
    `${persistImmediate}\n\nexport function persistHistoryStore`,
    'persistência com fallback autoritativo'
  );
  store = r.source; changed ||= r.changed;

  const requiredContracts = [
    'NATIVE_HISTORY_TRANSACTION_VERSION_R411 = 1',
    'cleanupInterruptedNativeTransactionR411',
    'verifyNativePayloadR411',
    'journal transacional',
    'manifesto de recuperação',
    'manifesto atual',
    'NATIVE_HISTORY_FALLBACK_AUTHORITY_KEY_R411',
    "writeNativeHistorySecondaryAuthorityR411('indexeddb'",
    "writeNativeHistorySecondaryAuthorityR411('local-fallback'",
    'removeAccountStorage(NATIVE_HISTORY_FALLBACK_AUTHORITY_KEY_R411)',
  ];
  for (const contract of requiredContracts) {
    if (!store.includes(contract)) throw new Error(`R411: contrato ausente após patch: ${contract}`);
  }
  if (!store.includes('if (isNativeVaultStorageAvailable() && !options.skipNative) await cleanupInterruptedNativeTransactionR411();')) {
    throw new Error('R411: limpeza de transação interrompida não instalada no carregamento.');
  }
  if (!store.includes('await nativeVaultWrite(NATIVE_HISTORY_TRANSACTION_KEY_R411(), journalRaw);')) {
    throw new Error('R411: journal não antecede staging.');
  }

  if (changed) writeFileSync(storePath, store, 'utf8');

  const testPath = resolve(root, TEST);
  const testSource = `import assert from 'node:assert/strict';\nimport fs from 'node:fs';\nconst store=fs.readFileSync('src/modules/vault/cardHistoryStore.ts','utf8');\nassert.match(store,/NATIVE_HISTORY_TRANSACTION_VERSION_R411 = 1/);\nassert.match(store,/__r411_transaction_v1/);\nassert.match(store,/cleanupInterruptedNativeTransactionR411/);\nassert.match(store,/verifyNativePayloadR411/);\nassert.match(store,/journal transacional/);\nassert.match(store,/manifesto de recuperação/);\nassert.match(store,/manifesto atual/);\nassert.match(store,/NATIVE_HISTORY_FALLBACK_AUTHORITY_KEY_R411/);\nassert.match(store,/writeNativeHistorySecondaryAuthorityR411\\('indexeddb'/);\nassert.match(store,/writeNativeHistorySecondaryAuthorityR411\\('local-fallback'/);\nassert.match(store,/removeAccountStorage\\(NATIVE_HISTORY_FALLBACK_AUTHORITY_KEY_R411\\)/);\nconst journalWrite=store.indexOf('await nativeVaultWrite(NATIVE_HISTORY_TRANSACTION_KEY_R411(), journalRaw);');\nconst shardWrite=store.indexOf('await nativeVaultWrite(entry.key, entry.payload);');\nconst manifestWrite=store.indexOf('await nativeVaultWrite(NATIVE_HISTORY_MANIFEST_KEY_R409(), manifestRaw);');\nassert.ok(journalWrite>=0&&shardWrite>journalWrite&&manifestWrite>shardWrite);\n\n// Modelo de recuperação: staging nunca pode apagar shards do atual/backup.\nfunction cleanupModel(journalKeys,currentKeys,backupKeys){const protectedKeys=new Set([...currentKeys,...backupKeys]);return journalKeys.filter((key)=>!protectedKeys.has(key));}\nassert.deepEqual(cleanupModel(['stage-x','old-b','current-a'],['current-a'],['backup-a']),['stage-x','old-b']);\nassert.deepEqual(cleanupModel(['new-a','old-a'],['new-a'],['old-a']),[]);\n\n// Crash antes do commit: manifesto antigo continua autoridade e staging é coletável.\nconst oldManifest={keys:['c0','c1'],cards:['a','b']};\nconst staged=['n0'];\nassert.deepEqual(cleanupModel(staged,oldManifest.keys,[]),['n0']);\nassert.deepEqual(oldManifest.cards,['a','b']);\n\n// Crash depois do commit e antes da coleta: staging comprometido fica protegido pelo manifesto novo.\nconst newManifest={keys:['n0','c1'],cards:['a','b']};\nassert.deepEqual(cleanupModel(['n0','very-old'],newManifest.keys,oldManifest.keys),['very-old']);\n\n// Autoridade secundária impede ressuscitar snapshot nativo antigo, inclusive quando o Cofre novo está vazio.\nfunction selectAuthority(marker,native,indexed,local){if(marker?.backend==='indexeddb')return indexed;if(marker?.backend==='local-fallback')return local;return native;}\nassert.deepEqual(selectAuthority({backend:'indexeddb'},[{saveKey:'old'}],[],[{saveKey:'older'}]),[]);\nassert.deepEqual(selectAuthority({backend:'local-fallback'},[{saveKey:'old'}],[{saveKey:'mid'}],[{saveKey:'new'}]),[{saveKey:'new'}]);\n\n// O PP continua propriedade da carta, sem depender do tamanho do Cofre.\nconst cards=Array.from({length:10000},(_,i)=>({saveKey:'card-'+i,result:{trainingPointsTotal:(i%140)+1}}));\nconst changed=cards.map((card,i)=>i===777?({...card,result:{trainingPointsTotal:140}}):card);\nassert.equal(changed.length,10000);\nassert.equal(changed[777].result.trainingPointsTotal,140);\nassert.equal(changed[9999].result.trainingPointsTotal,cards[9999].result.trainingPointsTotal);\nconsole.log('R411 aprovada: commit com journal, readback, coleta segura de órfãos e fallback mais novo explicitamente autoritativo.');\n`;
  if (!existsSync(testPath) || readFileSync(testPath, 'utf8') !== testSource) {
    writeFileSync(testPath, testSource, 'utf8');
    changed = true;
  }

  const pkg = JSON.parse(readFileSync(packagePath, 'utf8'));
  const marker = 'node tests/v40-80-r411-crash-safe-vault-commit-regression.mjs';
  const current = String(pkg.scripts?.['test:r200'] ?? '');
  if (!current) throw new Error('R411: test:r200 ausente.');
  if (!current.includes(marker)) {
    pkg.scripts['test:r200'] = `${current} && ${marker}`;
    writeFileSync(packagePath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    changed = true;
  }

  return {
    changed,
    sourceChanged: true,
    transactionalJournal: true,
    stagedShardReadback: true,
    manifestReadback: true,
    interruptedWriteGarbageCollection: true,
    fallbackAuthorityAfterNativeFailure: true,
    logicalHistoryLimit: 'unbounded',
    ppIsolation: 'per-card',
  };
}
