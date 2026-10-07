import assert from 'node:assert/strict';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://audit-fixture.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_fixtureaudit';
const { activeAccountNamespace } = require('../src/lib/accountStorage');
const modulePath = require.resolve('../src/lib/accountAuth');
const SESSION_KEY = 'buildmaster_cloud_auth_session_v2_secure';
const LICENSE_KEY = 'buildmaster_license_cache_v2_secure';
const IDENTITY_KEY = 'buildmaster_account_identity_v1';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function tokenResponse(userId: string) {
  return Response.json({ access_token: `fixture-${userId}-access`, refresh_token: `fixture-${userId}-refresh`, expires_in: 3600, user: { id: userId } });
}

function licenseResponse(userId: string) {
  return Response.json({ profile: { id: userId, username: userId, role: 'user', status: 'active', plan: 'fixture', maxDevices: 1, offlineGraceHours: 4, expiresAt: null }, validatedAt: new Date().toISOString() });
}

function fixture(handler: (url: URL) => Promise<Response> | Response, expired = false) {
  const rows = new Map<string, string>([
    [SESSION_KEY, JSON.stringify({ accessToken: 'fixture-original-access', refreshToken: 'fixture-original-refresh', userId: 'original-user', expiresAt: Date.now() + (expired ? -1 : 3_600_000) })],
    [IDENTITY_KEY, JSON.stringify({ id: 'original-user', username: 'originaluser', role: 'user', mode: 'cloud' })],
  ]);
  (globalThis as any).window = { localStorage: {
    getItem: (key: string) => rows.get(key) ?? null,
    setItem: (key: string, value: string) => rows.set(key, value),
    removeItem: (key: string) => rows.delete(key),
  } };
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    assert.equal(url.host, 'audit-fixture.supabase.co', 'Every request must terminate in this fixture.');
    return handler(url);
  };
  delete require.cache[modulePath];
  return { rows, auth: require(modulePath) as typeof import('../src/lib/accountAuth') };
}

function observe(promise: Promise<unknown>) {
  return promise.then(() => 'committed', () => 'cancelled');
}

async function refreshAfterLogout() {
  const started = deferred<void>(), response = deferred<Response>();
  const { rows, auth } = fixture((url) => {
    if (url.pathname === '/auth/v1/token') { started.resolve(); return response.promise; }
    assert.equal(url.pathname, '/auth/v1/logout');
    return new Response(null, { status: 204 });
  }, true);
  const pending = observe(auth.getValidAccountSession());
  await started.promise;
  await auth.signOutAccount();
  response.resolve(tokenResponse('original-user'));
  await pending;
  assert.equal(rows.has(SESSION_KEY), false, 'A refresh response arriving after logout must not restore remote credentials.');
  assert.equal(await auth.getValidAccountSession(), null);
  assert.equal(activeAccountNamespace(), 'legacy-local');
}

async function licenseAfterLogout() {
  const started = deferred<void>(), response = deferred<Response>();
  const { rows, auth } = fixture((url) => {
    if (url.pathname === '/functions/v1/license-session') { started.resolve(); return response.promise; }
    assert.equal(url.pathname, '/auth/v1/logout');
    return new Response(null, { status: 204 });
  });
  const pending = observe(auth.validateOnlineLicense());
  await started.promise;
  await auth.signOutAccount();
  response.resolve(licenseResponse('original-user'));
  await pending;
  assert.equal(rows.has(LICENSE_KEY), false, 'A pending license response must not revive the logged-out offline account.');
  assert.equal(activeAccountNamespace(), 'legacy-local');
}

async function refreshAfterSwitch() {
  const started = deferred<void>(), response = deferred<Response>();
  const { auth } = fixture((url) => {
    if (url.searchParams.get('grant_type') === 'refresh_token') { started.resolve(); return response.promise; }
    if (url.searchParams.get('grant_type') === 'password') return tokenResponse('replacement-user');
    assert.equal(url.pathname, '/functions/v1/license-session');
    return licenseResponse('replacement-user');
  }, true);
  const pending = observe(auth.getValidAccountSession());
  await started.promise;
  await auth.signInWithUsername('replacementuser', 'fixture-password');
  response.resolve(tokenResponse('original-user'));
  await pending;
  assert.equal((await auth.getValidAccountSession())?.userId, 'replacement-user', 'A previous account refresh must not replace a newer login.');
  assert.equal(activeAccountNamespace(), 'replacement-user');
}

async function logoutAfterSwitch() {
  const started = deferred<void>(), response = deferred<Response>();
  const { auth } = fixture((url) => {
    if (url.pathname === '/auth/v1/logout') { started.resolve(); return response.promise; }
    if (url.searchParams.get('grant_type') === 'password') return tokenResponse('replacement-user');
    assert.equal(url.pathname, '/functions/v1/license-session');
    return licenseResponse('replacement-user');
  });
  const pending = auth.signOutAccount();
  await started.promise;
  await auth.signInWithUsername('replacementuser', 'fixture-password');
  response.resolve(new Response(null, { status: 204 }));
  await pending;
  assert.equal((await auth.getValidAccountSession())?.userId, 'replacement-user', 'A previous logout response must not clear the newer account.');
  assert.equal(activeAccountNamespace(), 'replacement-user');
}

async function loginAfterLogout() {
  const started = deferred<void>(), response = deferred<Response>();
  const { rows, auth } = fixture((url) => {
    if (url.searchParams.get('grant_type') === 'password') { started.resolve(); return response.promise; }
    if (url.pathname === '/functions/v1/license-session') return licenseResponse('replacement-user');
    assert.equal(url.pathname, '/auth/v1/logout');
    return new Response(null, { status: 204 });
  });
  const pending = observe(auth.signInWithUsername('replacementuser', 'fixture-password'));
  await started.promise;
  await auth.signOutAccount();
  response.resolve(tokenResponse('replacement-user'));
  await pending;
  assert.equal(rows.has(SESSION_KEY), false, 'A login cancelled by explicit logout must not save its late response.');
  assert.equal(activeAccountNamespace(), 'legacy-local');
}

async function main() {
  const cases: Array<[string, () => Promise<void>]> = [
    ['refresh after logout', refreshAfterLogout], ['license after logout', licenseAfterLogout],
    ['refresh after account switch', refreshAfterSwitch], ['old logout after account switch', logoutAfterSwitch],
    ['login after logout', loginAfterLogout],
  ];
  const failures: unknown[] = [];
  for (const [name, run] of cases) {
    try { await run(); console.log(`PASS: ${name}`); }
    catch (error) { failures.push(error); console.error(`FAIL: ${name}`, error); }
  }
  if (failures.length) throw new AggregateError(failures, `${failures.length} account operation races failed.`);
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
