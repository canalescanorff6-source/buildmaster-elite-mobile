import assert from 'node:assert/strict';

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://audit-fixture.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_fixtureaudit';

const { activeAccountNamespace } = require('../src/lib/accountStorage');
const modulePath = require.resolve('../src/lib/accountAuth');
const SESSION_KEY = 'buildmaster_cloud_auth_session_v2_secure';
const IDENTITY_KEY = 'buildmaster_account_identity_v1';
const SNAPSHOT_KEY = 'buildmaster:session-snapshot:v38.40';
const vaultKey = 'buildmaster_account_fixture-user__buildmaster_history_v24_6_cofre_persistente';

function fixture(status: number) {
  const profile = { id: 'fixture-user', username: 'fixtureuser', role: 'user', status: 'active', expiresAt: null, offlineGraceHours: 4 };
  const rows = new Map<string, string>([
    [SESSION_KEY, JSON.stringify({ accessToken: 'fixture-access', refreshToken: 'fixture-refresh', userId: profile.id, expiresAt: Date.now() - 1 })],
    [IDENTITY_KEY, JSON.stringify({ id: profile.id, username: profile.username, role: profile.role, mode: 'cloud' })],
    [SNAPSHOT_KEY, JSON.stringify({ profile, savedAt: new Date().toISOString() })],
    [vaultKey, '["saved card"]'],
  ]);
  (globalThis as any).window = {
    localStorage: {
      getItem: (key: string) => rows.get(key) ?? null,
      setItem: (key: string, value: string) => rows.set(key, value),
      removeItem: (key: string) => rows.delete(key),
    },
  };
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = new URL(String(input));
    assert.equal(url.host, 'audit-fixture.supabase.co', 'No live backend is permitted in this test.');
    assert.equal(url.pathname, '/auth/v1/token');
    return Response.json({ error: 'fixture rejected refresh token' }, { status });
  };
  delete require.cache[modulePath];
  return { rows, auth: require(modulePath) as typeof import('../src/lib/accountAuth') };
}

async function main() {
  for (const status of [400, 401]) {
    const { rows, auth } = fixture(status);
    assert.equal(activeAccountNamespace(), 'fixture-user');
    await assert.rejects(auth.restoreAccountAccess(), /sessão expirou/i);
    assert.equal(await auth.getValidAccountSession(), null, 'Rejected remote credentials must be removed.');
    assert.equal(rows.has(SESSION_KEY), false);
    assert.equal(activeAccountNamespace(), 'fixture-user',
      'An invalid refresh must preserve the saved workspace namespace while AuthGate retains its offline snapshot.');
    assert.equal(rows.has(SNAPSHOT_KEY), true);
    assert.equal(rows.get(vaultKey), '["saved card"]');
    await auth.signOutAccount();
    assert.equal(activeAccountNamespace(), 'legacy-local', 'Explicit logout must clear the active workspace identity.');
    assert.equal(rows.get(vaultKey), '["saved card"]', 'Logout must preserve stored account data.');
  }
  console.log('Account refresh preservation: 400/401 remove remote credentials, preserve workspace and allow explicit logout.');
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
