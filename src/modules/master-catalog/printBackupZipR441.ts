export const PRINT_BACKUP_ZIP_R441_VERSION = '40.80-r441-print-backup-zip-v1' as const;

export type PrintBackupZipInputR441 = { name: string; data: Uint8Array };
export type PrintBackupZipEntryR441 = { name: string; data: Uint8Array; crc32: number };

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const UTF8_FLAG = 0x0800;
const STORE_METHOD = 0;
const DOS_TIME = 0;
const DOS_DATE_1980_01_01 = 0x0021;

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    table[n] = c >>> 0;
  }
  return table;
})();

export function crc32R441(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

export function sanitizeZipEntryNameR441(value: string) {
  const raw = String(value ?? '').replace(/\\/g, '/').trim();
  if (!raw || raw.startsWith('/') || /^[a-zA-Z]:\//.test(raw) || raw.includes('\0')) throw new Error('R441: caminho inseguro no ZIP.');
  const parts = raw.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..')) throw new Error('R441: caminho inseguro no ZIP.');
  return parts.join('/');
}

function u16(view: DataView, offset: number, value: number) { view.setUint16(offset, value & 0xffff, true); }
function u32(view: DataView, offset: number, value: number) { view.setUint32(offset, value >>> 0, true); }
function readU16(bytes: Uint8Array, offset: number) { return new DataView(bytes.buffer, bytes.byteOffset + offset, 2).getUint16(0, true); }
function readU32(bytes: Uint8Array, offset: number) { return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true); }

function concat(parts: Uint8Array[]) {
  const size = parts.reduce((sum, part) => sum + part.byteLength, 0);
  const output = new Uint8Array(size);
  let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.byteLength; }
  return output;
}

export function buildPrintBackupZipR441(inputs: readonly PrintBackupZipInputR441[]): Uint8Array {
  if (inputs.length > 0xffff) throw new Error('R441: ZIP excede o limite de entradas suportado.');
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let localOffset = 0;

  for (const input of inputs) {
    const name = sanitizeZipEntryNameR441(input.name);
    const nameBytes = encoder.encode(name);
    const data = input.data instanceof Uint8Array ? input.data : new Uint8Array(input.data);
    const crc = crc32R441(data);
    const local = new Uint8Array(30 + nameBytes.length + data.length);
    const lv = new DataView(local.buffer);
    u32(lv, 0, 0x04034b50);
    u16(lv, 4, 20);
    u16(lv, 6, UTF8_FLAG);
    u16(lv, 8, STORE_METHOD);
    u16(lv, 10, DOS_TIME);
    u16(lv, 12, DOS_DATE_1980_01_01);
    u32(lv, 14, crc);
    u32(lv, 18, data.length);
    u32(lv, 22, data.length);
    u16(lv, 26, nameBytes.length);
    u16(lv, 28, 0);
    local.set(nameBytes, 30);
    local.set(data, 30 + nameBytes.length);
    locals.push(local);

    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    u32(cv, 0, 0x02014b50);
    u16(cv, 4, 20);
    u16(cv, 6, 20);
    u16(cv, 8, UTF8_FLAG);
    u16(cv, 10, STORE_METHOD);
    u16(cv, 12, DOS_TIME);
    u16(cv, 14, DOS_DATE_1980_01_01);
    u32(cv, 16, crc);
    u32(cv, 20, data.length);
    u32(cv, 24, data.length);
    u16(cv, 28, nameBytes.length);
    u16(cv, 30, 0);
    u16(cv, 32, 0);
    u16(cv, 34, 0);
    u16(cv, 36, 0);
    u32(cv, 38, 0);
    u32(cv, 42, localOffset);
    central.set(nameBytes, 46);
    centrals.push(central);
    localOffset += local.length;
  }

  const centralBytes = concat(centrals);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  u32(ev, 0, 0x06054b50);
  u16(ev, 4, 0);
  u16(ev, 6, 0);
  u16(ev, 8, inputs.length);
  u16(ev, 10, inputs.length);
  u32(ev, 12, centralBytes.length);
  u32(ev, 16, localOffset);
  u16(ev, 20, 0);
  return concat([...locals, centralBytes, eocd]);
}

function findEocd(bytes: Uint8Array) {
  const min = Math.max(0, bytes.length - 22 - 0xffff);
  for (let offset = bytes.length - 22; offset >= min; offset -= 1) {
    if (readU32(bytes, offset) === 0x06054b50) return offset;
  }
  throw new Error('R441: ZIP inválido, EOCD ausente.');
}

export function readPrintBackupZipR441(bytes: Uint8Array): PrintBackupZipEntryR441[] {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 22) throw new Error('R441: ZIP inválido.');
  const eocd = findEocd(bytes);
  const total = readU16(bytes, eocd + 10);
  const centralSize = readU32(bytes, eocd + 12);
  const centralOffset = readU32(bytes, eocd + 16);
  if (centralOffset + centralSize > eocd || total > 0xffff) throw new Error('R441: integridade do diretório ZIP inválida.');

  const entries: PrintBackupZipEntryR441[] = [];
  let cursor = centralOffset;
  for (let index = 0; index < total; index += 1) {
    if (cursor + 46 > bytes.length || readU32(bytes, cursor) !== 0x02014b50) throw new Error('R441: integridade do diretório ZIP inválida.');
    const method = readU16(bytes, cursor + 10);
    if (method !== STORE_METHOD) throw new Error('R441: ZIP usa compressão não suportada.');
    const crc = readU32(bytes, cursor + 16);
    const compressed = readU32(bytes, cursor + 20);
    const uncompressed = readU32(bytes, cursor + 24);
    const nameLen = readU16(bytes, cursor + 28);
    const extraLen = readU16(bytes, cursor + 30);
    const commentLen = readU16(bytes, cursor + 32);
    const localOffset = readU32(bytes, cursor + 42);
    if (compressed !== uncompressed) throw new Error('R441: ZIP STORE com tamanhos divergentes.');
    if (cursor + 46 + nameLen + extraLen + commentLen > bytes.length) throw new Error('R441: integridade do nome ZIP inválida.');
    const name = sanitizeZipEntryNameR441(decoder.decode(bytes.subarray(cursor + 46, cursor + 46 + nameLen)));

    if (localOffset + 30 > bytes.length || readU32(bytes, localOffset) !== 0x04034b50) throw new Error('R441: cabeçalho local ZIP inválido.');
    const localMethod = readU16(bytes, localOffset + 8);
    if (localMethod !== STORE_METHOD) throw new Error('R441: ZIP usa compressão não suportada.');
    const localNameLen = readU16(bytes, localOffset + 26);
    const localExtraLen = readU16(bytes, localOffset + 28);
    const dataStart = localOffset + 30 + localNameLen + localExtraLen;
    const dataEnd = dataStart + compressed;
    if (dataEnd > bytes.length) throw new Error('R441: integridade dos dados ZIP inválida.');
    const data = bytes.slice(dataStart, dataEnd);
    if (crc32R441(data) !== crc) throw new Error(`R441: CRC/integridade inválida para ${name}.`);
    entries.push({ name, data, crc32: crc });
    cursor += 46 + nameLen + extraLen + commentLen;
  }
  return entries;
}

import type { CardSourceImageR441 } from './cardSourceVaultR441';
import { sha256BytesR441 } from './cardSourceVaultR441';

export type PrintBackupManifestR441 = {
  schemaVersion: 1;
  app: 'BuildMaster Elite Tático';
  createdAt: string;
  printCount: number;
  totalBytes: number;
  entries: Array<{
    sourceHash: string;
    catalogCardId: string | null;
    file: string;
    originalName: string;
    mime: string;
    bytes: number;
    width: number;
    height: number;
    checksum: string;
    storedAt: string;
  }>;
};

export async function buildPrintBackupArchiveR441(
  sources: readonly Array<{ metadata: CardSourceImageR441; data: Uint8Array }>,
  extras?: { catalogLocal?: unknown; ownedCards?: unknown; createdAt?: string }
) {
  const manifestEntries: PrintBackupManifestR441['entries'] = [];
  const zipEntries: PrintBackupZipInputR441[] = [];
  let totalBytes = 0;
  for (const source of sources) {
    const sourceHash = String(source.metadata.sourceHash ?? '').trim();
    if (!sourceHash) throw new Error('R441: print sem sourceHash no backup.');
    const extension = String(source.metadata.extension || 'bin').replace(/[^a-z0-9]/gi, '').toLowerCase() || 'bin';
    const file = sanitizeZipEntryNameR441(`prints/${sourceHash}.${extension}`);
    const checksum = await sha256BytesR441(source.data);
    if (source.metadata.originalChecksum && source.metadata.originalChecksum.toLowerCase() !== checksum) {
      throw new Error(`R441: checksum do original ${sourceHash} não confere antes do backup.`);
    }
    totalBytes += source.data.byteLength;
    manifestEntries.push({
      sourceHash,
      catalogCardId: source.metadata.catalogCardId ?? null,
      file,
      originalName: source.metadata.originalName,
      mime: source.metadata.mime,
      bytes: source.data.byteLength,
      width: source.metadata.width,
      height: source.metadata.height,
      checksum,
      storedAt: source.metadata.storedAt,
    });
    zipEntries.push({ name: file, data: source.data });
  }
  const manifest: PrintBackupManifestR441 = {
    schemaVersion: 1,
    app: 'BuildMaster Elite Tático',
    createdAt: extras?.createdAt ?? new Date().toISOString(),
    printCount: manifestEntries.length,
    totalBytes,
    entries: manifestEntries,
  };
  const json = (value: unknown) => encoder.encode(JSON.stringify(value, null, 2));
  zipEntries.unshift({ name: 'manifest.json', data: json(manifest) });
  if (extras?.catalogLocal !== undefined) zipEntries.push({ name: 'catalogo-local.json', data: json(extras.catalogLocal) });
  if (extras?.ownedCards !== undefined) zipEntries.push({ name: 'meu-elenco.json', data: json(extras.ownedCards) });
  return buildPrintBackupZipR441(zipEntries);
}

export async function readPrintBackupArchiveR441(zip: Uint8Array) {
  const entries = readPrintBackupZipR441(zip);
  const byName = new Map(entries.map((entry) => [entry.name, entry.data]));
  const rawManifest = byName.get('manifest.json');
  if (!rawManifest) throw new Error('R441: manifest.json ausente no backup de prints.');
  let manifest: PrintBackupManifestR441;
  try { manifest = JSON.parse(decoder.decode(rawManifest)) as PrintBackupManifestR441; }
  catch { throw new Error('R441: manifest.json inválido.'); }
  if (manifest?.schemaVersion !== 1 || manifest.app !== 'BuildMaster Elite Tático' || !Array.isArray(manifest.entries)) {
    throw new Error('R441: manifesto de backup incompatível.');
  }
  const files = new Map<string, Uint8Array>();
  let totalBytes = 0;
  const seen = new Set<string>();
  for (const item of manifest.entries) {
    const sourceHash = String(item.sourceHash ?? '').trim();
    if (!sourceHash || seen.has(sourceHash)) throw new Error('R441: sourceHash duplicado/inválido no manifesto.');
    seen.add(sourceHash);
    const file = sanitizeZipEntryNameR441(item.file);
    const data = byName.get(file);
    if (!data) throw new Error(`R441: arquivo ${file} ausente no ZIP.`);
    if (data.byteLength !== Number(item.bytes)) throw new Error(`R441: tamanho divergente para ${sourceHash}.`);
    const checksum = await sha256BytesR441(data);
    if (checksum !== String(item.checksum ?? '').toLowerCase()) throw new Error(`R441: checksum SHA-256 divergente para ${sourceHash}.`);
    totalBytes += data.byteLength;
    files.set(sourceHash, data);
  }
  if (manifest.printCount !== manifest.entries.length || manifest.totalBytes !== totalBytes) throw new Error('R441: resumo do manifesto não confere com os arquivos.');
  return {
    manifest,
    files,
    catalogLocal: byName.has('catalogo-local.json') ? JSON.parse(decoder.decode(byName.get('catalogo-local.json')!)) : null,
    ownedCards: byName.has('meu-elenco.json') ? JSON.parse(decoder.decode(byName.get('meu-elenco.json')!)) : null,
  };
}
