import assert from 'node:assert/strict';

const { setActiveAccountIdentity } = require('../src/lib/accountStorage');
const modulePath = require.resolve('../src/modules/vault/cardHistoryStore');
const nativeModulePath = require.resolve('../src/lib/nativeVaultStorage');
const HISTORY_KEY = 'buildmaster_history_v24_6_cofre_persistente';
const DB_A = 'buildmaster_cofre_fichas_db_v1__user-A';
const DB_B = 'buildmaster_cofre_fichas_db_v1__user-B';
type SavedAnalysis = import('../src/modules/vault/cardHistoryStore').SavedAnalysis;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function identity(id: string) { setActiveAccountIdentity({ id, username: id, role: 'user', mode: 'cloud' }); }
function card(id: string) { return { id, saveKey: id, rawText: `${id} private evidence` } as SavedAnalysis; }

function fixture(mode: 'indexed-commit' | 'indexed-failure' | 'native-read' | 'native-journal' | 'native-manifest' | 'native-remove') {
  const entered = deferred<void>(), release = deferred<void>();
  const fallbackB = `buildmaster_account_user-B__${HISTORY_KEY}`;
  const authorityB = `${fallbackB}_native_fallback_authority_r411`;
  const rows = new Map<string, string>([[fallbackB, 'private-B-local-fallback'], [authorityB, 'private-B-fallback-authority']]);
  (globalThis as any).window = { localStorage: {
    getItem: (key: string) => rows.get(key) ?? null,
    setItem: (key: string, value: string) => rows.set(key, value),
    removeItem: (key: string) => rows.delete(key),
  }, location: { protocol: mode.startsWith('native') ? 'capacitor:' : 'https:' } };
  identity('user-A');
  const databases = new Map<string, SavedAnalysis[]>([[DB_A, [card('original-A')]], [DB_B, [card('private-B')]]]);
  const writes: Array<{ name: string; ids: string[] }> = [], opens: string[] = [];
  let transactions = 0;
  (globalThis as any).window.indexedDB = { open: (name: string) => {
    opens.push(name);
    const request: any = {};
    request.result = { transaction: () => {
      const index = transactions++;
      const tx: any = { objectStore: () => ({ put: (items: SavedAnalysis[]) => {
        writes.push({ name, ids: items.map(({ id }) => id) });
        void (async () => {
          if (mode === 'indexed-commit' && index === 0) { entered.resolve(); await release.promise; }
          databases.set(name, structuredClone(items));
          queueMicrotask(() => tx.oncomplete?.());
        })();
      } }) };
      return tx;
    }, close: () => undefined };
    void (async () => {
      if (mode === 'indexed-failure') { entered.resolve(); await release.promise; request.error = new Error('fixture IndexedDB failure'); queueMicrotask(() => request.onerror?.()); }
      else queueMicrotask(() => request.onsuccess?.());
    })();
    return request;
  } };
  const nativeBaseB = 'buildmaster_cofre_fichas_db_v1_internal_file_v1__user-B';
  const nativeRows = new Map<string, string>([[nativeBaseB, 'private-B-monolith'], [`${nativeBaseB}__r409_manifest_v2`, 'private-B-manifest'], [`${nativeBaseB}__r409_manifest_backup_v2`, 'private-B-backup']]);
  const originalNativeB = structuredClone(nativeRows);
  const nativeMutations: string[] = [];
  let held = false;
  const hold = async (kind: string, key: string) => {
    const matching = (mode === 'native-read' && kind === 'read' && key.endsWith('__r409_manifest_v2'))
      || (mode === 'native-journal' && kind === 'write' && key.endsWith('__r411_transaction_v1'))
      || (mode === 'native-manifest' && kind === 'write' && key.endsWith('__r409_manifest_v2'))
      || (mode === 'native-remove' && kind === 'remove' && key.endsWith('_internal_file_v1__user-A'));
    if (matching && key.includes('__user-A') && !held) { held = true; entered.resolve(); await release.promise; }
  };
  (globalThis as any).window.Capacitor = { isNativePlatform: () => mode.startsWith('native'), Plugins: { BuildMasterVaultStorage: {
    read: async ({ key }: { key: string }) => { const value = nativeRows.get(key) ?? null; await hold('read', key); return { value, bytes: value?.length ?? 0 }; },
    write: async ({ key, value }: { key: string; value: string }) => { await hold('write', key); nativeMutations.push(key); nativeRows.set(key, value); return { bytes: value.length }; },
    remove: async ({ key }: { key: string }) => { await hold('remove', key); nativeMutations.push(key); nativeRows.delete(key); },
  } } };
  delete require.cache[nativeModulePath];
  delete require.cache[modulePath];
  const store = require(modulePath) as typeof import('../src/modules/vault/cardHistoryStore');
  return { store, rows, fallbackB, authorityB, databases, writes, opens, nativeRows, originalNativeB, nativeMutations, entered, release };
}

function assertAccountBUnchanged(f: ReturnType<typeof fixture>) {
  assert.equal(f.rows.get(f.fallbackB), 'private-B-local-fallback', 'An old A completion must not remove or overwrite B fallback history.');
  assert.equal(f.rows.get(f.authorityB), 'private-B-fallback-authority', 'An old A operation must not change B fallback authority.');
  assert.deepEqual(f.databases.get(DB_B), [card('private-B')]);
  assert.equal(f.opens.some((name) => name.endsWith('__user-B')), false, 'An A history operation must never open the B history database.');
  assert.equal(f.nativeMutations.some((key) => key.includes('__user-B')), false, 'Native shards, manifests and cleanup must retain the original A owner.');
  assert.deepEqual(new Map([...f.nativeRows].filter(([key]) => key.includes('__user-B'))), f.originalNativeB);
}

async function queuedHistoryAfterSwitch() {
  const f = fixture('indexed-commit');
  const first = f.store.persistHistoryStore([card('blocker-A')]);
  await f.entered.promise;
  const queued = f.store.persistHistoryStore([card('private-A-restore')]);
  identity('user-B');
  f.release.resolve();
  const [, result] = await Promise.all([first, queued]);
  assertAccountBUnchanged(f);
  assert.equal(result.saved, false, 'A queued history snapshot must cancel when its namespace changes before execution.');
  assert.equal(f.writes.length, 1, 'Only the already-started A write may complete.');
}

async function historyAfterSwitch(mode: Parameters<typeof fixture>[0]) {
  const f = fixture(mode);
  const pending = f.store.persistHistoryStore([card('private-A-restore')]);
  await f.entered.promise;
  identity('user-B');
  f.release.resolve();
  const result = await pending;
  assertAccountBUnchanged(f);
  assert.equal(result.saved, false, 'The old history operation must not be adopted as a successful current-account commit.');
}

async function main() {
  const cases: Array<[string, () => Promise<void>]> = [
    ['real history snapshot queued before account switch', queuedHistoryAfterSwitch],
    ['real IndexedDB history completion after switch', () => historyAfterSwitch('indexed-commit')],
    ['real IndexedDB failure before local fallback after switch', () => historyAfterSwitch('indexed-failure')],
    ['native manifest read after switch', () => historyAfterSwitch('native-read')],
    ['native journal write after switch', () => historyAfterSwitch('native-journal')],
    ['native manifest commit after switch', () => historyAfterSwitch('native-manifest')],
    ['native cleanup completion after switch', () => historyAfterSwitch('native-remove')],
  ];
  const failures: unknown[] = [];
  for (const [name, run] of cases) {
    try { await run(); console.log(`PASS: ${name}`); }
    catch (error) { failures.push(error); console.error(`FAIL: ${name}`, error); }
  }
  if (failures.length) throw new AggregateError(failures, `${failures.length} real vault storage owner-isolation regressions failed.`);
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
