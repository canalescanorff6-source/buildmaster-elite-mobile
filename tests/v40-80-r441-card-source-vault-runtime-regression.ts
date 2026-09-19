import assert from 'node:assert/strict';
import {
  buildCardSourceKeyR441,
  extensionForCardSourceR441,
  sha256BytesR441,
  mergeCardSourceMetadataR441,
  sourceVaultSummaryR441,
  type CardSourceImageR441,
} from '@/modules/master-catalog/cardSourceVaultR441';

function meta(index: number): CardSourceImageR441 {
  return {
    sourceHash: `hash-${index}`,
    catalogCardId: index % 2 === 0 ? `card-${index}` : null,
    originalName: `print-${index}.png`,
    mime: 'image/png',
    extension: 'png',
    bytes: 1000 + index,
    width: 1080,
    height: 2400,
    storedAt: '2026-09-18T20:00:00.000Z',
    lastUsedAt: null,
    originalChecksum: `sha-${index}`,
    thumbnailRef: `thumb-${index}`,
  };
}

assert.equal(buildCardSourceKeyR441('abc123'), 'card-source:v1:abc123');
assert.equal(extensionForCardSourceR441('Foto.CARTA.PNG', 'image/png'), 'png');
assert.equal(extensionForCardSourceR441('sem-extensao', 'image/jpeg'), 'jpg');

const original = meta(1);
const merged = mergeCardSourceMetadataR441(original, {
  catalogCardId: 'master-card-1',
  originalName: 'renamed.png',
  lastUsedAt: '2026-09-19T01:00:00.000Z',
  storedAt: '2099-01-01T00:00:00.000Z',
});
assert.equal(merged.sourceHash, original.sourceHash);
assert.equal(merged.catalogCardId, 'master-card-1');
assert.equal(merged.storedAt, original.storedAt, 'storedAt original deve ser preservado');
assert.equal(merged.lastUsedAt, '2026-09-19T01:00:00.000Z');

const items = Array.from({ length: 222 }, (_, index) => meta(index));
const summary = sourceVaultSummaryR441(items);
assert.equal(summary.count, 222);
assert.equal(summary.linked, 111);
assert.equal(summary.unlinked, 111);
assert.equal(summary.totalBytes, items.reduce((sum, item) => sum + item.bytes, 0));

void (async () => {
  const digest = await sha256BytesR441(new Uint8Array([1, 2, 3]));
  assert.equal(digest, '039058c6f2c0cb492c533b0a4d14ef77cc0f78abccced5287d84a1a2011cfb81');
  console.log('R441 cofre de prints aprovado: chave por hash, SHA-256, merge idempotente e 222+ originais sem teto artificial.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
