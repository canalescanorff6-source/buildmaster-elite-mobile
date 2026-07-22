import { strict as assert } from 'node:assert';
import { CURRENT_DATA_SCHEMA, buildHealthSummary, createBackupEnvelope, inspectDataIntegrity, migrateBackup, validateBackupEnvelope } from '../src/lib/dataSafety';

const history = [{ id: '1', saveKey: 'a', result: { parsed: { playerName: 'Teste' } } }];
const backup = createBackupEnvelope({ history, settings: { advancedMode: true }, calibration: {}, plans: {} }, '2026-07-12T00:00:00.000Z');
const checked = validateBackupEnvelope(backup);
assert.equal(checked.valid, true);
assert.ok(checked.migrated);

const integrity = inspectDataIntegrity(backup.sections);
assert.equal(integrity.status, 'healthy');
assert.equal(integrity.totals.records >= 1, true);

const corrupted = { ...backup, checksum: '00000000' };
assert.equal(validateBackupEnvelope(corrupted).valid, false);

const legacy = validateBackupEnvelope({ items: history });
assert.equal(legacy.valid, true);
assert.ok(legacy.issues.some((item) => item.code === 'legacy-history'));

const migrated = migrateBackup({ ...backup, schema: 1 });
assert.ok(migrated.steps.length > 0);
assert.equal(migrated.envelope.schema, CURRENT_DATA_SCHEMA);

const health = buildHealthSummary({ integrity, backupAgeDays: null, pendingReviews: 2, lowConfidence: 1, totalHistory: 1 });
assert.ok(health.alerts.length >= 2);
assert.ok(health.score >= 0 && health.score <= 100);

console.log('Lote 14 segurança e qualidade: OK');
