import assert from 'node:assert/strict';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://audit-fixture.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_fixtureaudit';
const { activeAccountNamespace } = require('../src/lib/accountStorage');
const secureStorage = require('../src/lib/secureStorage');
const modulePath = require.resolve('../src/lib/accountAuth');
const SESSION_KEY = 'buildmaster_cloud_auth_session_v2_secure';
const LICENSE_KEY = 'buildmaster_license_cache_v2_secure';
const IDENTITY_KEY = 'buildmaster_account_identity_v1';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function session(userId = 'original-user') {
  return { accessToken: `fixture-${userId}-access`, refreshToken: `fixture-${userId}-refresh`, userId, expiresAt: Date.now() + 3_600_000 };
}

function tokenResponse(userId: string) {
  return Response.json({ access_token: `fixture-${userId}-access`, refresh_token: `fixture-${userId}-refresh`, expires_in: 3600, user: { id: userId } });
}

function licenseResponse(userId: string) {
  return Response.json({ profile: { id: userId, username: userId, role: 'user', status: 'active', plan: 'fixture', maxDevices: 1, offlineGraceHours: 4, expiresAt: null }, validatedAt: new Date().toISOString() });
}

type Hooks = {
  set?: (key: string, value: string) => Promise<void>;
  get?: (key: string) => Promise<void>;
  remove?: (key: string) => Promise<void>;
  password?: () => void;
};

function fixture(hooks: Hooks = {}) {
  // Model native secure storage separately from the web account-identity namespace.
  const credentials = new Map<string, string>([[SESSION_KEY, JSON.stringify(session())]]);
  const local = new Map<string, string>([[IDENTITY_KEY, JSON.stringify({ id: 'original-user', username: 'originaluser', role: 'user', mode: 'cloud' })]]);
  (globalThis as any).window = { localStorage: {
    getItem: (key: string) => local.get(key) ?? null,
    setItem: (key: string, value: string) => local.set(key, value),
    removeItem: (key: string) => local.delete(key),
  } };
  secureStorage.secureGet = async (key: string) => {
    const value = credentials.get(key) ?? null;
    await hooks.get?.(key);
    return value;
  };
  secureStorage.secureSet = async (key: string, value: string) => {
    await hooks.set?.(key, value);
    credentials.set(key, value);
  };
  secureStorage.secureRemove = async (key: string) => {
    await hooks.remove?.(key);
    credentials.delete(key);
  };
  secureStorage.migrateLegacyValueToSecureStorage = async (key: string) => credentials.get(key) ?? null;
  secureStorage.getNativeDeviceIdentity = async () => null;
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.host, 'audit-fixture.supabase.co', 'Every request must terminate in this fixture.');
    if (url.searchParams.get('grant_type') === 'password') {
      hooks.password?.();
      const username = JSON.parse(String(init?.body)).email.split('@')[0];
      return tokenResponse(username);
    }
    if (url.pathname === '/auth/v1/logout') return new Response(null, { status: 204 });
    assert.equal(url.pathname, '/functions/v1/license-session');
    const access = new Headers(init?.headers).get('Authorization') || '';
    const userId = access.replace('Bearer fixture-', '').replace(/-access$/, '');
    return licenseResponse(userId);
  };
  const freshAuth = () => {
    delete require.cache[modulePath];
    return require(modulePath) as typeof import('../src/lib/accountAuth');
  };
  return { credentials, auth: freshAuth(), freshAuth };
}

function observe<T>(promise: Promise<T>) {
  return promise.then((value) => ({ status: 'fulfilled' as const, value }), (error: unknown) => ({ status: 'rejected' as const, error }));
}

// Drain the unblocked request/cleanup microtasks while the simulated native operation remains held.
function drainReadyWork() { return new Promise<void>((resolve) => setImmediate(resolve)); }

async function delayedSessionWriteAfterLogout() {
  const entered = deferred<void>(), release = deferred<void>();
  const { credentials, auth, freshAuth } = fixture({ set: async (key) => {
    if (key === SESSION_KEY) { entered.resolve(); await release.promise; }
  } });
  await auth.getValidAccountSession();
  const login = observe(auth.signInWithUsername('replacementuser', 'fixture-password'));
  await entered.promise;
  const logout = auth.signOutAccount();
  await drainReadyWork();
  release.resolve();
  const [result] = await Promise.all([login, logout]);
  assert.equal(result.status, 'rejected', 'Explicit logout must cancel the pending native session write.');
  assert.equal(credentials.has(SESSION_KEY), false, 'An already-started native write must be removed before logout completes.');
  assert.equal(await freshAuth().getValidAccountSession(), null, 'Reopening the app must not authenticate the cancelled login.');
  assert.equal(activeAccountNamespace(), 'legacy-local');
}

async function delayedLicenseWriteAfterLogout() {
  const entered = deferred<void>(), release = deferred<void>();
  const { credentials, auth, freshAuth } = fixture({ set: async (key) => {
    if (key === LICENSE_KEY) { entered.resolve(); await release.promise; }
  } });
  await auth.getValidAccountSession();
  const validation = observe(auth.validateOnlineLicense());
  await entered.promise;
  const logout = auth.signOutAccount();
  await drainReadyWork();
  release.resolve();
  const [result] = await Promise.all([validation, logout]);
  assert.equal(result.status, 'rejected');
  assert.equal(credentials.has(LICENSE_KEY), false, 'Logout must remove a license whose native write was already pending.');
  assert.equal(await freshAuth().restoreCachedAccessForUsername('original-user'), null);
  assert.equal(activeAccountNamespace(), 'legacy-local', 'The delayed license must not reactivate the logged-out account identity.');
}

async function delayedReadAfterLogout() {
  const entered = deferred<void>(), release = deferred<void>();
  let held = false;
  const { auth } = fixture({ get: async (key) => {
    if (key === SESSION_KEY && !held) { held = true; entered.resolve(); await release.promise; }
  } });
  const read = auth.getValidAccountSession();
  await entered.promise;
  const logout = auth.signOutAccount();
  release.resolve();
  const [result] = await Promise.all([read, logout]);
  assert.equal(result, null, 'A native read from an earlier generation must not return an authenticated session after logout starts.');
  assert.equal(await auth.getValidAccountSession(), null, 'The old read must not repopulate the memory session.');
}

async function delayedWriteBeforeNewLogin() {
  const entered = deferred<void>(), release = deferred<void>(), replacementStarted = deferred<void>();
  let passwordRequests = 0;
  const { credentials, auth, freshAuth } = fixture({
    set: async (key, value) => {
      if (key === SESSION_KEY && JSON.parse(value).userId === 'cancelleduser') { entered.resolve(); await release.promise; }
    },
    password: () => { if (++passwordRequests === 2) replacementStarted.resolve(); },
  });
  await auth.getValidAccountSession();
  const cancelled = observe(auth.signInWithUsername('cancelleduser', 'fixture-password'));
  await entered.promise;
  const replacement = auth.signInWithUsername('replacementuser', 'fixture-password');
  await replacementStarted.promise;
  await drainReadyWork();
  release.resolve();
  const [oldResult] = await Promise.all([cancelled, replacement]);
  assert.equal(oldResult.status, 'rejected');
  assert.equal(JSON.parse(credentials.get(SESSION_KEY)!).userId, 'replacementuser', 'A late old native write must not overwrite the newer login.');
  assert.equal((await freshAuth().getValidAccountSession())?.userId, 'replacementuser');
  assert.equal(activeAccountNamespace(), 'replacementuser');
}

async function delayedRemovalBeforeNewLogin() {
  const entered = deferred<void>(), release = deferred<void>(), replacementStarted = deferred<void>();
  let held = false;
  const { credentials, auth, freshAuth } = fixture({
    remove: async (key) => {
      if (key === SESSION_KEY && !held) { held = true; entered.resolve(); await release.promise; }
    },
    password: () => replacementStarted.resolve(),
  });
  await auth.getValidAccountSession();
  const logout = auth.signOutAccount();
  await entered.promise;
  const replacement = auth.signInWithUsername('replacementuser', 'fixture-password');
  await replacementStarted.promise;
  await drainReadyWork();
  release.resolve();
  await Promise.all([logout, replacement]);
  assert.equal(JSON.parse(credentials.get(SESSION_KEY)!).userId, 'replacementuser', 'An old pending logout removal must run before the newer login write.');
  assert.equal((await freshAuth().getValidAccountSession())?.userId, 'replacementuser');
  assert.equal(activeAccountNamespace(), 'replacementuser', 'An old logout tail must not clear the newer account identity.');
}

async function main() {
  const cases: Array<[string, () => Promise<void>]> = [
    ['native session write after logout', delayedSessionWriteAfterLogout],
    ['native license write after logout', delayedLicenseWriteAfterLogout],
    ['native session read after logout', delayedReadAfterLogout],
    ['old native session write before replacement login', delayedWriteBeforeNewLogin],
    ['old native logout removal before replacement login', delayedRemovalBeforeNewLogin],
  ];
  const failures: unknown[] = [];
  for (const [name, run] of cases) {
    try { await run(); console.log(`PASS: ${name}`); }
    catch (error) { failures.push(error); console.error(`FAIL: ${name}`, error); }
  }
  if (failures.length) throw new AggregateError(failures, `${failures.length} native secure-storage races failed.`);
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
