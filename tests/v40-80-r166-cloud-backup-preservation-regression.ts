import assert from 'node:assert/strict';

// All HTTP requests terminate in this in-memory fixture; no live account is used.
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://audit-fixture.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'sb_publishable_fixtureaudit';

const storage = new Map<string, string>([
  ['buildmaster_cloud_auth_session_v2_secure', JSON.stringify({
    accessToken: 'fixture-access', refreshToken: 'fixture-refresh',
    userId: 'fixture-user', expiresAt: Date.now() + 3_600_000,
  })],
]);
(globalThis as any).window = {
  localStorage: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  },
};

let remote: Record<string, any> | null = null;
let networkFailure = false;
globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = new URL(String(input));
  assert.equal(url.host, 'audit-fixture.supabase.co', 'The regression must never contact a live backend.');
  assert.equal(url.pathname, '/rest/v1/user_vault_snapshots');
  const headers = new Headers(init?.headers);
  assert.equal(headers.get('Authorization'), 'Bearer fixture-access');
  if (networkFailure) throw new TypeError('fixture network failure');
  const method = init?.method ?? 'GET';
  if (method === 'GET') return Response.json(remote ? [{ payload: structuredClone(remote) }] : []);
  if (method === 'POST') {
    const row = JSON.parse(String(init?.body));
    assert.equal(row.user_id, 'fixture-user');
    remote = structuredClone(row.payload);
  } else if (method === 'DELETE') remote = null;
  else throw new Error(`Unexpected fixture method: ${method}`);
  return new Response(null, { status: 204 });
};

const { createBackupEnvelope, validateBackupEnvelope } = require('../src/lib/dataSafety');
const { createVaultCloudOperationsR166 } = require('../src/modules/backup/vaultCloudRuntimeR166');
type SavedAnalysis = import('../src/modules/vault/cardHistoryStore').SavedAnalysis;

const first = { id: 'first', saveKey: 'first-card', result: { parsed: { playerName: 'First' } } } as SavedAnalysis;
const second = { id: 'second', saveKey: 'second-card', result: { parsed: { playerName: 'Second' } } } as SavedAnalysis;
const performance = { matchTrainerSessions: [{ id: 'match-1', notes: 'preserve this match' }] };
const imageGallery = [{ id: 'image-1', source: 'fixture-image' }];
let preservedSnapshots: unknown[] = [];

function seed(items: SavedAnalysis[]) {
  const envelope = createBackupEnvelope({ history: items, performance, imageGallery }, '2026-10-05T10:00:00.000Z');
  preservedSnapshots = [{ id: 'restore-1', createdAt: envelope.exportedAt, envelope: structuredClone(envelope) }];
  remote = { version: 'fixture-version', schema: envelope.schema, deviceLabel: 'Other device',
    items: structuredClone(items), fullBackup: envelope, snapshots: structuredClone(preservedSnapshots),
    extensionData: { keep: true }, updatedAt: envelope.exportedAt };
}

function operations(history: SavedAnalysis[]) {
  return createVaultCloudOperationsR166({
    cloudEnabled: true, history, getCanonicalHistory: () => history,
    setHistory: () => { throw new Error('A cloud write must not mutate local history.'); },
    setStatus: () => undefined, setLibraryOpen: () => undefined,
  }, { setCloudLoading: () => undefined, setCloudStatus: () => undefined });
}

function assertPreservedHistory(expectedIds: string[]) {
  assert.ok(remote, 'Removing a vault card must preserve the cloud backup row.');
  assert.deepEqual(remote.items.map((item: SavedAnalysis) => item.id), expectedIds,
    'The current cloud vault must match the committed local history, including an empty vault.');
  assert.deepEqual(remote.fullBackup.sections.history.map((item: SavedAnalysis) => item.id), expectedIds,
    'Full-backup restore must not resurrect removed cards from a stale history section.');
  assert.deepEqual(remote.fullBackup.sections.performance, performance);
  assert.deepEqual(remote.fullBackup.sections.imageGallery, imageGallery);
  assert.deepEqual(remote.snapshots, preservedSnapshots, 'Historical restore points must remain available.');
  assert.deepEqual(remote.extensionData, { keep: true });
  assert.equal(remote.deviceLabel, 'Other device');
  assert.equal(validateBackupEnvelope(remote.fullBackup).valid, true, 'The updated backup must retain a valid checksum.');
}

async function main() {
  const cases: Array<[string, () => Promise<void>]> = [
    ['empty committed upload clears current history and preserves backup', async () => {
      seed([first]);
      await operations([]).pushCloudHistory([], true);
      assertPreservedHistory([]);
    }],
    ['deleting the last card preserves the cloud backup row', async () => {
      seed([first]);
      await operations([first]).deleteCloudHistoryItem(first);
      assertPreservedHistory([]);
    }],
    ['ordinary upload updates current full-backup history', async () => {
      seed([first, second]);
      await operations([second]).pushCloudHistory([second], true);
      assertPreservedHistory(['second']);
    }],
    ['deleting one card updates full-backup history and keeps remaining card', async () => {
      seed([first, second]);
      await operations([first, second]).deleteCloudHistoryItem(first);
      assertPreservedHistory(['second']);
    }],
    ['network failure preserves the previous remote backup', async () => {
      seed([first, second]);
      const beforeFailure = structuredClone(remote);
      networkFailure = true;
      await operations([]).pushCloudHistory([], true);
      networkFailure = false;
      assert.deepEqual(remote, beforeFailure, 'A failed upload must preserve the previous remote backup.');
    }],
  ];
  const failures: unknown[] = [];
  for (const [name, run] of cases) {
    try { await run(); console.log(`PASS: ${name}`); }
    catch (error) { failures.push(error); console.error(`FAIL: ${name}`, error); }
  }
  if (failures.length) throw new AggregateError(failures, `${failures.length} cloud preservation regressions failed.`);

  console.log('R166 cloud backup preservation: empty uploads, card deletion, full-backup history and network failures verified.');
}

void main().catch((error) => { console.error(error); process.exitCode = 1; });
