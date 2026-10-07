import assert from 'node:assert/strict';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://audit-fixture.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_fixtureaudit';
const { setActiveAccountIdentity } = require('../src/lib/accountStorage');
const modulePath = require.resolve('../src/lib/accountAuth');
const payload = {
  readingSession: { session_key: 'private-A-reading' },
  buildHistory: { build_fingerprint: 'private-A-build' },
  learningModels: [{ scope: 'card', scope_key: 'private-A-model' }],
};
const tables = ['card_reading_sessions_r470', 'card_build_history_r470', 'learning_models_r470'];

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function fixture(holdTable?: string) {
  const rows = new Map<string, string>([['buildmaster_cloud_auth_session_v2_secure', JSON.stringify({ accessToken: 'fixture-user-A-access', refreshToken: 'fixture-user-A-refresh', userId: 'user-A', expiresAt: Date.now() + 3_600_000 })]]);
  (globalThis as any).window = { localStorage: {
    getItem: (key: string) => rows.get(key) ?? null,
    setItem: (key: string, value: string) => rows.set(key, value),
    removeItem: (key: string) => rows.delete(key),
  } };
  setActiveAccountIdentity({ id: 'user-A', username: 'usera', role: 'user', mode: 'cloud' });
  const entered = deferred<void>(), release = deferred<void>();
  const writes: Array<{ table: string; owner: string }> = [];
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    assert.equal(url.host, 'audit-fixture.supabase.co', 'Learning-cloud requests must remain inside this fixture.');
    if (url.searchParams.get('grant_type') === 'password') return Response.json({ access_token: 'fixture-user-B-access', refresh_token: 'fixture-user-B-refresh', expires_in: 3600, user: { id: 'user-B' } });
    if (url.pathname === '/functions/v1/license-session') return Response.json({ profile: { id: 'user-B', username: 'userb', role: 'user', status: 'active', plan: 'fixture', expiresAt: null, maxDevices: 1, offlineGraceHours: 4 }, validatedAt: new Date().toISOString() });
    const table = url.pathname.split('/').at(-1)!;
    assert.equal(tables.includes(table), true);
    const body = JSON.parse(String(init?.body));
    assert.equal(body.length, 1);
    const owner = body[0].user_id;
    assert.equal(new Headers(init?.headers).get('Authorization'), `Bearer fixture-${owner}-access`);
    writes.push({ table, owner });
    if (table === holdTable) { entered.resolve(); await release.promise; }
    return new Response(null, { status: 204 });
  };
  delete require.cache[modulePath];
  return { auth: require(modulePath) as typeof import('../src/lib/accountAuth'), writes, entered, release };
}

async function cancellationDuringUpsert(index: number, changeAccount: boolean) {
  const f = fixture(tables[index]);
  let current = true;
  const sync = f.auth.syncIntelligentLearningR470 as (value: typeof payload, current?: () => boolean) => Promise<boolean>;
  const pending = sync(payload, () => current);
  await f.entered.promise;
  if (changeAccount) await f.auth.signInWithUsername('userb', 'fixture-password');
  else current = false;
  f.release.resolve();
  assert.equal(await pending, false, 'An obsolete learning operation must return cancelled, including after its final response.');
  assert.deepEqual(f.writes, tables.slice(0, index + 1).map((table) => ({ table, owner: 'user-A' })), 'Only already-started original-owner upserts may finish; subsequent tables must not be sent.');
}

async function cancellationBeforeEntry() {
  const f = fixture();
  const sync = f.auth.syncIntelligentLearningR470 as (value: typeof payload, current?: () => boolean) => Promise<boolean>;
  assert.equal(await sync(payload, () => false), false);
  assert.deepEqual(f.writes, [], 'A cancelled reading must not send any learning-cloud row.');
}

async function sameOwnerCompatibility() {
  const f = fixture();
  assert.equal(await f.auth.syncIntelligentLearningR470(payload), true);
  assert.deepEqual(f.writes, tables.map((table) => ({ table, owner: 'user-A' })));
}

async function main() {
  const cases: Array<[string, () => Promise<void>]> = [
    ['cancelled before learning sync', cancellationBeforeEntry],
    ...tables.map((table, index): [string, () => Promise<void>] => [`cancelled during ${table}`, () => cancellationDuringUpsert(index, false)]),
    ['account switch during first learning upsert', () => cancellationDuringUpsert(0, true)],
    ['same owner without optional callback', sameOwnerCompatibility],
  ];
  const failures: unknown[] = [];
  for (const [name, run] of cases) {
    try { await run(); console.log(`PASS: ${name}`); }
    catch (error) { failures.push(error); console.error(`FAIL: ${name}`, error); }
  }
  if (failures.length) throw new AggregateError(failures, `${failures.length} learning-cloud owner-isolation regressions failed.`);
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
