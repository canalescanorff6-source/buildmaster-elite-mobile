import assert from 'node:assert/strict';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://audit-fixture.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_fixtureaudit';
const { activeAccountNamespace } = require('../src/lib/accountStorage');
const { createBackupEnvelope } = require('../src/lib/dataSafety');
const { runSerializedVaultCloudMutationR128 } = require('../src/modules/vault/vaultCloudQueueR128');
const collector = require('../src/modules/backup/backupSectionCollectorR141');
const snapshots = require('../src/modules/backup/backupSnapshotRepositoryR141');
const persistence = require('../src/modules/vault/vaultPersistenceCoordinatorR140');
const realCriticalRestore = persistence.commitCriticalVaultRestoreR140;
const { MATCH_VALIDATION_STORAGE_KEY } = require('../src/lib/appStartupContractsR200');
const imageLibrary = require('../src/modules/images/accountImageLibrary');
const authModulePath = require.resolve('../src/lib/accountAuth');
const runtimeModulePath = require.resolve('../src/modules/backup/cardVisionBackupRuntimeR162');
type BackupSnapshot = import('../src/modules/backup/syncBackupEngine').BackupSnapshot;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}
function drainReadyWork() { return new Promise<void>((resolve) => setImmediate(resolve)); }

type Hooks = {
  collect?: () => Promise<void>;
  snapshots?: () => Promise<void>;
  critical?: () => Promise<void>;
  images?: () => Promise<void>;
  get?: () => Promise<void>;
  post?: () => Promise<void>;
};

function fixture(hooks: Hooks = {}, useRealCriticalRestore = false) {
  const settingsKeyB = 'buildmaster_account_user-B__buildmaster_ui_prefs_v24_24';
  const matchesKeyB = `buildmaster_account_user-B__${MATCH_VALIDATION_STORAGE_KEY}`;
  const match = (id: string) => ({ id, cardFingerprint: id, playerName: id, targetPosition: 'CB', playedAt: '2026-10-05T10:00:00.000Z', tags: [] });
  const rows = new Map<string, string>([
    ['buildmaster_cloud_auth_session_v2_secure', JSON.stringify({ accessToken: 'fixture-user-A-access', refreshToken: 'fixture-user-A-refresh', userId: 'user-A', expiresAt: Date.now() + 3_600_000 })],
    ['buildmaster_account_identity_v1', JSON.stringify({ id: 'user-A', username: 'usera', role: 'user', mode: 'cloud' })],
    [settingsKeyB, JSON.stringify({ accentTheme: 'blue', privateOwner: 'user-B' })],
    [matchesKeyB, JSON.stringify([match('private-B-match')])],
    [`buildmaster_account_user-A__${MATCH_VALIDATION_STORAGE_KEY}`, JSON.stringify([match('original-A-match')])],
  ]);
  (globalThis as any).window = { localStorage: {
    getItem: (key: string) => rows.get(key) ?? null,
    setItem: (key: string, value: string) => rows.set(key, value),
    removeItem: (key: string) => rows.delete(key),
  }, dispatchEvent: () => true };
  (globalThis as any).CustomEvent ??= class { constructor(public type: string) {} };
  const localSections = { history: [], settings: { accentTheme: 'gold', privateOwner: 'user-A' }, plans: { privateOwner: 'user-A' }, ...(hooks.images ? { imageGallery: [], performance: { guidedWeeklyGoal: 6 } } : {}), ...(useRealCriticalRestore ? { evolution: { matchValidation: [match('restored-A-match')] } } : {}) };
  const remote = new Map<string, Record<string, any>>([
    ['user-A', { items: [], fullBackup: createBackupEnvelope(localSections), snapshots: [], extensionData: { privateOwner: 'user-A' } }],
    ['user-B', { items: [], fullBackup: createBackupEnvelope({ history: [], settings: { accentTheme: 'blue', privateOwner: 'user-B' } }), snapshots: [] }],
  ]);
  const originalRemoteB = structuredClone(remote.get('user-B'));
  const requests: Array<{ method: string; owner: string }> = [];
  const commits: Array<{ kind: string; owner: string }> = [];
  const adopted: Array<{ kind: string; owner: string }> = [];
  collector.collectFullBackupSectionsR141 = async () => { await hooks.collect?.(); return structuredClone(localSections); };
  snapshots.persistBackupSnapshotsR141 = async (next: BackupSnapshot[]) => {
    commits.push({ kind: 'snapshots', owner: activeAccountNamespace() });
    await hooks.snapshots?.();
    return next;
  };
  persistence.commitCriticalVaultRestoreR140 = useRealCriticalRestore ? realCriticalRestore : async () => {
    commits.push({ kind: 'critical', owner: activeAccountNamespace() });
    await hooks.critical?.();
    return { ok: true, history: [], matches: [], historyPersistence: { saved: true, backend: 'local-fallback', items: 0 }, matchPersistence: null, rolledBackMatches: false, error: null };
  };
  if (useRealCriticalRestore) (globalThis as any).window.indexedDB = { open: (name: string) => {
    const request: any = { result: { transaction: () => {
      const transaction: any = { objectStore: () => ({ put: () => {
        commits.push({ kind: `critical:${name}`, owner: activeAccountNamespace() });
        void (async () => { await hooks.critical?.(); queueMicrotask(() => transaction.oncomplete?.()); })();
      } }) };
      return transaction;
    }, close: () => undefined } };
    queueMicrotask(() => request.onsuccess?.());
    return request;
  } };
  imageLibrary.importTacticalImageLibrary = async () => {
    commits.push({ kind: 'images', owner: activeAccountNamespace() });
    await hooks.images?.();
  };
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.host, 'audit-fixture.supabase.co', 'No full-backup regression may contact a live backend.');
    if (url.searchParams.get('grant_type') === 'password') return Response.json({ access_token: 'fixture-user-B-access', refresh_token: 'fixture-user-B-refresh', expires_in: 3600, user: { id: 'user-B' } });
    if (url.pathname === '/functions/v1/license-session') return Response.json({ profile: { id: 'user-B', username: 'userb', role: 'user', status: 'active', plan: 'fixture', expiresAt: null, maxDevices: 1, offlineGraceHours: 4 }, validatedAt: new Date().toISOString() });
    assert.equal(url.pathname, '/rest/v1/user_vault_snapshots');
    const method = init?.method ?? 'GET';
    const owner = (new Headers(init?.headers).get('Authorization') || '').replace('Bearer fixture-', '').replace(/-access$/, '');
    requests.push({ method, owner });
    if (method === 'GET') {
      assert.equal(url.searchParams.get('user_id'), `eq.${owner}`);
      const snapshot = structuredClone(remote.get(owner));
      await hooks.get?.();
      return Response.json([{ payload: snapshot }]);
    }
    assert.equal(method, 'POST');
    const row = JSON.parse(String(init?.body));
    assert.equal(row.user_id, owner);
    await hooks.post?.();
    remote.set(owner, structuredClone(row.payload));
    return new Response(null, { status: 204 });
  };
  delete require.cache[authModulePath];
  delete require.cache[runtimeModulePath];
  const auth = require(authModulePath) as typeof import('../src/lib/accountAuth');
  const { createCardVisionBackupOperationsR162 } = require(runtimeModulePath) as typeof import('../src/modules/backup/cardVisionBackupRuntimeR162');
  const context = new Proxy({
    renderHistory: [], vaultFolders: [], backupSnapshots: [], restoreSections: {}, migrationLog: [],
    ocrZones: [], efhubCalibrationZones: [], efhubCalibrationZonesRef: { current: [] }, efhubCalibrationActiveRef: { current: false },
    appTheme: 'dark', accentTheme: 'gold', profileAvatar: null,
    cloud: { setCloudLoading: () => undefined, setCloudStatus: () => undefined, requireSecureAccountCloud: () => undefined,
      pushCloudHistory: async () => undefined, pullCloudHistory: async () => undefined,
      runGuardedVaultActionR154: async (_options: unknown, task: () => Promise<unknown>) => task(),
      persistAndAdoptVaultHistoryR140: async () => [],
    },
  }, { get: (target, property) => {
    if (String(property).startsWith('set')) return () => { if (property !== 'setStatus') adopted.push({ kind: String(property), owner: activeAccountNamespace() }); };
    return Reflect.get(target, property);
  } }) as unknown as import('../src/modules/backup/cardVisionBackupRuntimeR162').CardVisionBackupRuntimeContextR162;
  return {
    operations: createCardVisionBackupOperationsR162(context), rows, settingsKeyB, matchesKeyB, originalMatchesB: rows.get(matchesKeyB), remote, originalRemoteB, requests, commits, adopted,
    switchAccount: () => auth.signInWithUsername('userb', 'fixture-password'),
  };
}

type Operation = 'sync' | 'pull';
function invoke(f: ReturnType<typeof fixture>, operation: Operation) {
  return operation === 'sync' ? f.operations.syncFullCloudBackup() : f.operations.pullAndMergeFullCloudBackup();
}

function assertAccountBUnchanged(f: ReturnType<typeof fixture>) {
  assert.equal(f.rows.get(f.settingsKeyB), JSON.stringify({ accentTheme: 'blue', privateOwner: 'user-B' }));
  assert.equal(f.rows.get(f.matchesKeyB), f.originalMatchesB, 'A cancelled A critical restore must not roll back A matches into B.');
  assert.deepEqual(f.remote.get('user-B'), f.originalRemoteB);
  assert.deepEqual(f.commits.filter(({ owner }) => owner === 'user-B'), [], 'An A backup must not start persistence into B.');
  assert.deepEqual(f.adopted.filter(({ owner }) => owner === 'user-B'), [], 'A completed A backup must not be adopted into B UI state.');
  assert.deepEqual(f.requests.filter(({ method }) => method === 'POST' ).filter(({ owner }) => owner === 'user-B'), [], 'An A backup must not upload under B authorization.');
}

async function queuedAfterSwitch(operation: Operation) {
  const entered = deferred<void>(), release = deferred<void>();
  const f = fixture();
  const blocker = runSerializedVaultCloudMutationR128(async () => { entered.resolve(); await release.promise; });
  await entered.promise;
  const pending = invoke(f, operation);
  await drainReadyWork();
  await f.switchAccount();
  release.resolve();
  await Promise.all([blocker, pending]);
  assert.deepEqual(f.requests, [], 'A full backup queued for A must abort before any request under B.');
  assertAccountBUnchanged(f);
}

async function switchDuringBoundary(boundary: keyof Hooks, operation: Operation = 'sync', useRealCriticalRestore = false) {
  const entered = deferred<void>(), release = deferred<void>();
  const f = fixture({ [boundary]: async () => { entered.resolve(); await release.promise; } }, useRealCriticalRestore);
  const pending = invoke(f, operation);
  await entered.promise;
  await f.switchAccount();
  release.resolve();
  await pending;
  assertAccountBUnchanged(f);
}

async function main() {
  const cases: Array<[string, () => Promise<void>]> = [
    ['queued full sync after switch', () => queuedAfterSwitch('sync')],
    ['queued full pull after switch', () => queuedAfterSwitch('pull')],
    ['full-backup collection after switch', () => switchDuringBoundary('collect')],
    ['full-backup GET after switch', () => switchDuringBoundary('get')],
    ['full-backup critical restore completion after switch', () => switchDuringBoundary('critical')],
    ['full-backup snapshots completion after switch', () => switchDuringBoundary('snapshots', 'pull')],
    ['full-backup image import completion after switch', () => switchDuringBoundary('images')],
    ['full-backup POST completion after switch', () => switchDuringBoundary('post')],
    ['real critical restore rollback after account switch', () => switchDuringBoundary('critical', 'sync', true)],
  ];
  const failures: unknown[] = [];
  for (const [name, run] of cases) {
    try { await run(); console.log(`PASS: ${name}`); }
    catch (error) { failures.push(error); console.error(`FAIL: ${name}`, error); }
  }
  if (failures.length) throw new AggregateError(failures, `${failures.length} full-backup account-isolation regressions failed.`);
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
