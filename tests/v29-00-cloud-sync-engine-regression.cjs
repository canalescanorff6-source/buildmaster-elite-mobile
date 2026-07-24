require('./_ts-require.cjs');
const assert = require('assert/strict');
const { createBackupEnvelope, validateBackupEnvelope } = require('../src/lib/dataSafety.ts');
const {
  compareBackupEnvelopes,
  mergeBackupEnvelopes,
  createBackupSnapshot,
  pruneSnapshots,
  buildCloudVaultPayload,
  normalizeCloudVaultPayload,
  buildSyncHealth
} = require('../src/modules/backup/syncBackupEngine.ts');

const local = createBackupEnvelope({
  history: [{ id: 'a', updatedAt: '2026-07-24T10:00:00Z', result: {} }],
  settings: { theme: 'light' },
  performance: { competitiveMatches: [{ id: 'm1', updatedAt: '2026-07-24T11:00:00Z' }] }
}, '2026-07-24T12:00:00Z');
const remote = createBackupEnvelope({
  history: [{ id: 'a', updatedAt: '2026-07-20T10:00:00Z', result: {} }, { id: 'b', updatedAt: '2026-07-23T10:00:00Z', result: {} }],
  settings: { density: 'comfortable' },
  tacticalStudio: [{ id: 'poster-1', updatedAt: '2026-07-22T10:00:00Z' }]
}, '2026-07-23T12:00:00Z');
const conflicts = compareBackupEnvelopes(local, remote);
assert.equal(conflicts.some((item) => item.section === 'history' && item.recommendation === 'merge'), true);
assert.equal(conflicts.some((item) => item.section === 'performance' && item.state === 'local-only'), true);
const merged = mergeBackupEnvelopes(local, remote);
assert.equal(Array.isArray(merged.sections.history), true);
assert.equal(merged.sections.history.length, 2);
assert.equal(merged.sections.performance != null, true);
assert.equal(merged.sections.tacticalStudio != null, true);
assert.equal(validateBackupEnvelope(merged).valid, true);
const snapshot = createBackupSnapshot(local, 'Teste', 'Moto G56');
assert.equal(snapshot.recordCount > 0, true);
assert.equal(pruneSnapshots([snapshot, snapshot]).length, 1);
const payload = buildCloudVaultPayload(merged, [snapshot], 'Moto G56');
const normalized = normalizeCloudVaultPayload(payload);
assert.equal(normalized.fullBackup.checksum, merged.checksum);
assert.equal(normalized.items.length, 2);
assert.equal(normalized.snapshots.length >= 1, true);
const health = buildSyncHealth({ local, remote, snapshots: [snapshot], lastSyncAt: '2026-07-24T12:00:00Z' });
assert.equal(health.score >= 0 && health.score <= 100, true);
assert.equal(health.conflicts.length, 11 + 1); // 12 seções incluindo performance
console.log('v29.00 cloud sync engine regression: ok');
