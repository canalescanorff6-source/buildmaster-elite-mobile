import assert from 'node:assert/strict';
import { createMasterCardCatalogEntryR438 } from '@/modules/card-catalog/masterCardCatalogR438';
import {
  applyMasterCatalogPlanR441,
  buildMasterCatalogSyncPlanR441,
  rollbackMasterCatalogR441,
  sanitizeMasterCatalogManifestR441,
  selectCatalogChunkDescriptorsR441,
  validateCatalogChunkChecksumR441,
  type MasterCatalogChunkR441,
} from '@/modules/master-catalog/masterCatalogSyncR441';

const cardA = createMasterCardCatalogEntryR438({ playerName: 'Cristiano Ronaldo', mainPosition: 'CF', sourceHash: 'sha-a', cardLabel: 'Show Time A' });
const cardB = createMasterCardCatalogEntryR438({ playerName: 'Neymar Jr', mainPosition: 'LWF', sourceHash: 'sha-b', cardLabel: 'Epic B' });
const cardC = createMasterCardCatalogEntryR438({ playerName: 'Kaká', mainPosition: 'AMF', sourceHash: 'sha-c', cardLabel: 'Epic C' });

const manifest = sanitizeMasterCatalogManifestR441({
  schemaVersion: 1,
  catalogVersion: '2026.09.20-13',
  gameVersion: 'eFootball 2027 v6.0.0',
  publishedAt: '2026-09-20T12:00:00.000Z',
  minimumAppVersion: '40.80.0',
  cardCount: 3,
  previousCatalogVersion: '2026.09.18-12',
  chunks: [{ id: 'delta-13', url: 'https://example.invalid/delta-13.json', sha256: 'abc', bytes: 123, mode: 'delta', fromVersion: '2026.09.18-12', toVersion: '2026.09.20-13' }],
  releaseNotes: ['+1 carta'],
});
assert.equal(manifest.catalogVersion, '2026.09.20-13');
assert.throws(() => validateCatalogChunkChecksumR441('abc', 'def'), /checksum/i);
assert.equal(validateCatalogChunkChecksumR441('ABC', 'abc'), true);

const chainedManifest = sanitizeMasterCatalogManifestR441({
  ...manifest,
  catalogVersion: '2026.09.22-14',
  previousCatalogVersion: '2026.09.20-13',
  chunks: [
    { id: 'delta-13', url: 'https://example.invalid/13.json', sha256: 'a', bytes: 1, mode: 'delta', fromVersion: '2026.09.18-12', toVersion: '2026.09.20-13' },
    { id: 'delta-14', url: 'https://example.invalid/14.json', sha256: 'b', bytes: 1, mode: 'delta', fromVersion: '2026.09.20-13', toVersion: '2026.09.22-14' },
    { id: 'base-14', url: 'https://example.invalid/base14.json', sha256: 'c', bytes: 1, mode: 'base', fromVersion: null, toVersion: '2026.09.22-14' },
  ],
});
assert.deepEqual(selectCatalogChunkDescriptorsR441('2026.09.18-12', chainedManifest).map((item) => item.id), ['delta-13', 'delta-14']);
assert.deepEqual(selectCatalogChunkDescriptorsR441('unknown', chainedManifest).map((item) => item.id), ['base-14']);

const chunk: MasterCatalogChunkR441 = {
  schemaVersion: 1,
  id: 'delta-13',
  fromVersion: '2026.09.18-12',
  toVersion: '2026.09.20-13',
  upsert: [cardC],
  remove: [cardA.catalogCardId],
};

const plan = buildMasterCatalogSyncPlanR441({
  appVersion: '40.80.0',
  activeVersion: '2026.09.18-12',
  manifest,
  chunks: [chunk],
  localCatalog: [cardA, cardB],
  ownedCatalogIds: new Set([cardA.catalogCardId]),
});
assert.equal(plan.changed, true);
assert.equal(plan.added, 1);
assert.equal(plan.removed, 0, 'carta possuída não pode ser removida');
assert.deepEqual(plan.retainedOwned, [cardA.catalogCardId]);
assert.equal(plan.nextCatalog.length, 3);

const applied = applyMasterCatalogPlanR441(plan);
assert.equal(applied.activeVersion, '2026.09.20-13');
assert.equal(applied.previousVersion, '2026.09.18-12');
assert.equal(applied.previousCatalog.length, 2);

const rolled = rollbackMasterCatalogR441(applied);
assert.equal(rolled.activeVersion, '2026.09.18-12');
assert.equal(rolled.catalog.length, 2);

const same = buildMasterCatalogSyncPlanR441({ ...plan.input, activeVersion: manifest.catalogVersion, localCatalog: plan.nextCatalog });
assert.equal(same.changed, false);
assert.equal(same.nextCatalog.length, 3);

assert.throws(() => buildMasterCatalogSyncPlanR441({ ...plan.input, appVersion: '40.70.0' }), /versão mínima|minimum/i);

console.log('R441 sync aprovado: delta transacional, compatibilidade, posse preservada, idempotência e rollback.');
