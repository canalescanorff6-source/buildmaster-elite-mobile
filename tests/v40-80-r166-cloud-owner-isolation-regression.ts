import assert from 'node:assert/strict';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://audit-fixture.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_fixtureaudit';
const { activeAccountNamespace } = require('../src/lib/accountStorage');
const { normalizeSavedAnalysis } = require('../src/modules/vault/cardHistoryStore');
const { runSerializedVaultCloudMutationR128 } = require('../src/modules/vault/vaultCloudQueueR128');
const authModulePath = require.resolve('../src/lib/accountAuth');
const runtimeModulePath = require.resolve('../src/modules/backup/vaultCloudRuntimeR166');
type SavedAnalysis = import('../src/modules/vault/cardHistoryStore').SavedAnalysis;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

const fixtureCards = new Map<string, SavedAnalysis>();
function card(id: string): SavedAnalysis {
  if (fixtureCards.has(id)) return structuredClone(fixtureCards.get(id)!);
  const value = normalizeSavedAnalysis({ id, saveKey: id, result: { parsed: { playerName: id } } });
  assert.ok(value, 'The fixture must contain valid canonical vault cards.');
  fixtureCards.set(id, value);
  return value;
}

type Hooks = { get?: () => Promise<void>; post?: () => Promise<void>; localCommit?: () => Promise<void> };

function fixture(hooks: Hooks = {}) {
  const rows = new Map<string, string>([
    ['buildmaster_cloud_auth_session_v2_secure', JSON.stringify({ accessToken: 'fixture-user-A-access', refreshToken: 'fixture-user-A-refresh', userId: 'user-A', expiresAt: Date.now() + 3_600_000 })],
    ['buildmaster_account_identity_v1', JSON.stringify({ id: 'user-A', username: 'usera', role: 'user', mode: 'cloud' })],
  ]);
  (globalThis as any).window = { localStorage: {
    getItem: (key: string) => rows.get(key) ?? null,
    setItem: (key: string, value: string) => rows.set(key, value),
    removeItem: (key: string) => rows.delete(key),
  } };
  const localA = card('local-A-card'), localB = card('local-B-card');
  const remote = new Map<string, Record<string, any>>([
    ['user-A', { items: [card('private-A-card')], extensionData: { privateOwner: 'user-A' } }],
    ['user-B', { items: [card('private-B-card')], extensionData: { privateOwner: 'user-B' } }],
  ]);
  const histories = new Map<string, SavedAnalysis[]>([['user-A', [localA]], ['user-B', [localB]]]);
  const originalRemote = structuredClone(remote), originalHistories = structuredClone(histories);
  const requests: Array<{ method: string; owner: string }> = [];
  const localCommits: string[] = [], stateUpdates: string[] = [];
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.host, 'audit-fixture.supabase.co', 'No regression request may reach a live backend.');
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
      return Response.json(snapshot ? [{ payload: snapshot }] : []);
    }
    if (method === 'POST') {
      const row = JSON.parse(String(init?.body));
      assert.equal(row.user_id, owner, 'Vault rows must agree with their authorized owner.');
      await hooks.post?.();
      remote.set(owner, structuredClone(row.payload));
      return new Response(null, { status: 204 });
    }
    throw new Error(`Unexpected cloud fixture mutation: ${method}`);
  };
  delete require.cache[authModulePath];
  delete require.cache[runtimeModulePath];
  const auth = require(authModulePath) as typeof import('../src/lib/accountAuth');
  const { createVaultCloudOperationsR166 } = require(runtimeModulePath) as typeof import('../src/modules/backup/vaultCloudRuntimeR166');
  const operations = createVaultCloudOperationsR166({
    cloudEnabled: true, history: [localA], getCanonicalHistory: () => histories.get(activeAccountNamespace()) || [],
    setHistory: () => { stateUpdates.push(activeAccountNamespace()); },
    setStatus: () => undefined, setLibraryOpen: () => undefined,
    commitCanonicalHistory: async (mutate) => {
      await hooks.localCommit?.();
      const owner = activeAccountNamespace();
      const next = mutate(histories.get(owner) || []);
      localCommits.push(owner);
      histories.set(owner, next);
      return next;
    },
  }, { setCloudLoading: () => undefined, setCloudStatus: () => undefined });
  return {
    auth, operations, localA, remote, histories, originalRemote, originalHistories, requests, localCommits, stateUpdates,
    switchAccount: () => auth.signInWithUsername('userb', 'fixture-password'),
  };
}

type Operation = 'push' | 'pull' | 'sync' | 'delete';
function invoke(f: ReturnType<typeof fixture>, operation: Operation) {
  if (operation === 'push') return f.operations.pushCloudHistory();
  if (operation === 'pull') return f.operations.pullCloudHistory();
  if (operation === 'sync') return f.operations.syncCloudHistory();
  return f.operations.deleteCloudHistoryItem(f.localA);
}

async function getAfterSwitch(operation: Operation) {
  const entered = deferred<void>(), release = deferred<void>();
  const f = fixture({ get: async () => { entered.resolve(); await release.promise; } });
  const pending = invoke(f, operation);
  await entered.promise;
  await f.switchAccount();
  release.resolve();
  await pending;
  assert.equal(f.requests.filter(({ method }) => method === 'POST').length, 0, `An old-owner ${operation} must abort before any cloud write.`);
  assert.deepEqual(f.localCommits, [], 'An old-owner response must not enter the new account local vault.');
  assert.deepEqual(f.stateUpdates, [], 'An old-owner response must not update the new account UI history.');
  assert.deepEqual(f.remote, f.originalRemote);
  assert.deepEqual(f.histories, f.originalHistories);
}

async function queuedMutationsAfterSwitch() {
  const entered = deferred<void>(), release = deferred<void>();
  const f = fixture();
  const blocker = runSerializedVaultCloudMutationR128(async () => { entered.resolve(); await release.promise; });
  await entered.promise;
  const pending = [invoke(f, 'push'), invoke(f, 'sync'), invoke(f, 'delete')];
  await f.switchAccount();
  release.resolve();
  await Promise.all([blocker, ...pending]);
  assert.deepEqual(f.requests, [], 'A cloud operation queued for A must not start any vault request under B.');
  assert.deepEqual(f.localCommits, []);
  assert.deepEqual(f.remote, f.originalRemote);
  assert.deepEqual(f.histories, f.originalHistories);
}

async function queuedLocalCommitAfterSwitch() {
  const entered = deferred<void>(), release = deferred<void>();
  const f = fixture({ localCommit: async () => { entered.resolve(); await release.promise; } });
  const pending = invoke(f, 'pull');
  await entered.promise;
  await f.switchAccount();
  release.resolve();
  await pending;
  assert.deepEqual(f.localCommits, [], 'The canonical mutation must check its original owner when its queue executes.');
  assert.deepEqual(f.histories, f.originalHistories);
  assert.deepEqual(f.stateUpdates, []);
}

async function postCompletionAfterSwitch() {
  const entered = deferred<void>(), release = deferred<void>();
  const f = fixture({ post: async () => { entered.resolve(); await release.promise; } });
  const pending = invoke(f, 'sync');
  await entered.promise;
  await f.switchAccount();
  release.resolve();
  await pending;
  assert.deepEqual(f.requests.filter(({ method }) => method === 'POST'), [{ method: 'POST', owner: 'user-A' }], 'An already-sent request retains only the original authorization.');
  assert.deepEqual(f.stateUpdates, [], 'The old transaction completion must not adopt A history into B state.');
  assert.deepEqual(f.histories.get('user-B'), f.originalHistories.get('user-B'));
  assert.deepEqual(f.remote.get('user-B'), f.originalRemote.get('user-B'));
}

async function directLoadAfterSwitch() {
  const entered = deferred<void>(), release = deferred<void>();
  const f = fixture({ get: async () => { entered.resolve(); await release.promise; } });
  const pending = f.auth.loadAccountVault().then(() => 'accepted', () => 'cancelled');
  await entered.promise;
  await f.switchAccount();
  release.resolve();
  assert.equal(await pending, 'cancelled', 'The account API must reject an old-owner payload before returning it to any caller.');
}

async function main() {
  const cases: Array<[string, () => Promise<void>]> = [
    ...(['push', 'pull', 'sync', 'delete'] as Operation[]).map((operation): [string, () => Promise<void>] => [`${operation} after account switch during GET`, () => getAfterSwitch(operation)]),
    ['queued cloud tasks after account switch', queuedMutationsAfterSwitch],
    ['queued canonical local mutation after account switch', queuedLocalCommitAfterSwitch],
    ['cloud POST completion after account switch', postCompletionAfterSwitch],
    ['direct vault load after account switch', directLoadAfterSwitch],
  ];
  const failures: unknown[] = [];
  for (const [name, run] of cases) {
    try { await run(); console.log(`PASS: ${name}`); }
    catch (error) { failures.push(error); console.error(`FAIL: ${name}`, error); }
  }
  if (failures.length) throw new AggregateError(failures, `${failures.length} cloud account-isolation regressions failed.`);
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
