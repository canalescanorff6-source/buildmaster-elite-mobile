import assert from 'node:assert/strict';
import {
  buildPrintBackupZipR441,
  buildPrintBackupArchiveR441,
  readPrintBackupArchiveR441,
  crc32R441,
  readPrintBackupZipR441,
  sanitizeZipEntryNameR441,
} from '@/modules/master-catalog/printBackupZipR441';

const enc = new TextEncoder();
const first = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
const second = new Uint8Array([0xff, 0xd8, 0xff, 9, 8, 7, 6]);
const manifest = enc.encode(JSON.stringify({ schemaVersion: 1, printCount: 2 }));

assert.equal(sanitizeZipEntryNameR441('prints/abc.png'), 'prints/abc.png');
assert.throws(() => sanitizeZipEntryNameR441('../evil.png'), /caminho inseguro/i);
assert.throws(() => sanitizeZipEntryNameR441('/absolute.png'), /caminho inseguro/i);

const zip = buildPrintBackupZipR441([
  { name: 'manifest.json', data: manifest },
  { name: 'prints/hash-a.png', data: first },
  { name: 'prints/hash-b.jpg', data: second },
]);
assert.ok(zip.byteLength > manifest.byteLength + first.byteLength + second.byteLength);

const entries = readPrintBackupZipR441(zip);
assert.equal(entries.length, 3);
const byName = new Map(entries.map((entry) => [entry.name, entry]));
assert.deepEqual(Array.from(byName.get('prints/hash-a.png')!.data), Array.from(first));
assert.deepEqual(Array.from(byName.get('prints/hash-b.jpg')!.data), Array.from(second));
assert.equal(byName.get('prints/hash-a.png')!.crc32, crc32R441(first));
assert.deepEqual(JSON.parse(new TextDecoder().decode(byName.get('manifest.json')!.data)), { schemaVersion: 1, printCount: 2 });

const corrupted = zip.slice();
const hit = corrupted.findIndex((value, index) => value === 0x89 && corrupted[index + 1] === 0x50 && corrupted[index + 2] === 0x4e);
assert.ok(hit > 0);
corrupted[hit] ^= 0xff;
assert.throws(() => readPrintBackupZipR441(corrupted), /CRC|integridade/i);

console.log('R441 ZIP aprovado: STORE determinístico, CRC32, leitura segura e bloqueio de path traversal.');


void (async () => {
  const archive = await buildPrintBackupArchiveR441([
    {
      metadata: { sourceHash: 'hash-a', catalogCardId: 'card-a', originalName: 'a.png', mime: 'image/png', extension: 'png', bytes: first.length, width: 1080, height: 2400, storedAt: '2026-09-18T20:00:00.000Z', lastUsedAt: null, originalChecksum: await crypto.subtle.digest('SHA-256', first).then((d) => Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('')), thumbnailRef: 'thumb-a' },
      data: first,
    },
    {
      metadata: { sourceHash: 'hash-b', catalogCardId: null, originalName: 'b.jpg', mime: 'image/jpeg', extension: 'jpg', bytes: second.length, width: 720, height: 1280, storedAt: '2026-09-18T20:00:00.000Z', lastUsedAt: null, originalChecksum: await crypto.subtle.digest('SHA-256', second).then((d) => Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, '0')).join('')), thumbnailRef: null },
      data: second,
    },
  ]);
  const parsed = await readPrintBackupArchiveR441(archive);
  assert.equal(parsed.manifest.printCount, 2);
  assert.equal(parsed.manifest.entries[0].catalogCardId, 'card-a');
  assert.deepEqual(Array.from(parsed.files.get('hash-a')!), Array.from(first));
  assert.deepEqual(Array.from(parsed.files.get('hash-b')!), Array.from(second));
  console.log('R441 ZIP manifesto aprovado: vínculos e SHA-256 preservados no backup portátil.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
