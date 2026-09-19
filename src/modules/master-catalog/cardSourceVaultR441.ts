export const CARD_SOURCE_VAULT_R441_VERSION = '40.80-r441-card-source-vault-v1' as const;
export const CARD_SOURCE_KEY_PREFIX_R441 = 'card-source:v1:' as const;

export type CardSourceImageR441 = {
  sourceHash: string;
  catalogCardId: string | null;
  originalName: string;
  mime: string;
  extension: string;
  bytes: number;
  width: number;
  height: number;
  storedAt: string;
  lastUsedAt: string | null;
  originalChecksum: string;
  thumbnailRef: string | null;
};

export type CardSourceVaultSummaryR441 = {
  count: number;
  linked: number;
  unlinked: number;
  totalBytes: number;
};

function cleanText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

export function buildCardSourceKeyR441(sourceHash: string) {
  const hash = cleanText(sourceHash);
  if (!hash) throw new Error('R441: sourceHash ausente.');
  return `${CARD_SOURCE_KEY_PREFIX_R441}${hash}`;
}

export function mergeCardSourceMetadataR441(
  current: CardSourceImageR441,
  patch: Partial<CardSourceImageR441>
): CardSourceImageR441 {
  return {
    ...current,
    ...patch,
    sourceHash: current.sourceHash,
    catalogCardId: cleanText(patch.catalogCardId) || current.catalogCardId,
    originalName: cleanText(patch.originalName) || current.originalName,
    mime: cleanText(patch.mime) || current.mime,
    extension: cleanText(patch.extension) || current.extension,
    bytes: Number.isFinite(Number(patch.bytes)) && Number(patch.bytes) > 0 ? Math.round(Number(patch.bytes)) : current.bytes,
    width: Number.isFinite(Number(patch.width)) && Number(patch.width) >= 0 ? Math.round(Number(patch.width)) : current.width,
    height: Number.isFinite(Number(patch.height)) && Number(patch.height) >= 0 ? Math.round(Number(patch.height)) : current.height,
    storedAt: current.storedAt,
    lastUsedAt: cleanText(patch.lastUsedAt) || current.lastUsedAt,
    originalChecksum: cleanText(patch.originalChecksum) || current.originalChecksum,
    thumbnailRef: cleanText(patch.thumbnailRef) || current.thumbnailRef,
  };
}

export function sourceVaultSummaryR441(items: readonly CardSourceImageR441[]): CardSourceVaultSummaryR441 {
  let linked = 0;
  let totalBytes = 0;
  for (const item of items) {
    if (cleanText(item.catalogCardId)) linked += 1;
    const bytes = Number(item.bytes);
    if (Number.isFinite(bytes) && bytes > 0) totalBytes += bytes;
  }
  return {
    count: items.length,
    linked,
    unlinked: items.length - linked,
    totalBytes,
  };
}

const MIME_EXT_R441: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
  'image/avif': 'avif',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'image/tiff': 'tiff',
  'image/tif': 'tiff',
  'image/svg+xml': 'svg',
};

export const CARD_SOURCE_META_KEY_PREFIX_R441 = 'card-source-meta:v1:' as const;

export function extensionForCardSourceR441(name: string, mime: string) {
  const match = String(name ?? '').trim().toLowerCase().match(/\.([a-z0-9]{2,6})$/);
  if (match?.[1]) return match[1] === 'jpeg' ? 'jpg' : match[1];
  return MIME_EXT_R441[String(mime ?? '').trim().toLowerCase()] ?? 'bin';
}

function bytesToHexR441(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function sha256BytesR441(value: Uint8Array | ArrayBuffer | Blob) {
  const buffer = value instanceof Blob
    ? await value.arrayBuffer()
    : value instanceof Uint8Array
      ? value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)
      : value;
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return bytesToHexR441(new Uint8Array(digest));
}

export function buildCardSourceMetaKeyR441(sourceHash: string) {
  const hash = String(sourceHash ?? '').trim();
  if (!hash) throw new Error('R441: sourceHash ausente para metadados.');
  return `${CARD_SOURCE_META_KEY_PREFIX_R441}${hash}`;
}

export async function storeCardSourceImageR441(input: {
  sourceHash: string;
  file: File;
  catalogCardId?: string | null;
  thumbnailRef?: string | null;
}): Promise<CardSourceImageR441> {
  const sourceHash = String(input.sourceHash ?? '').trim();
  if (!sourceHash) throw new Error('R441: sourceHash ausente para salvar o print original.');
  const [{ validateImageFile }, { runtimeGet, runtimePut }] = await Promise.all([
    import('@/modules/images/imageSafety'),
    import('@/lib/localDatabase'),
  ]);
  const validated = await validateImageFile(input.file);
  const originalChecksum = await sha256BytesR441(validated.sanitizedBlob);
  const existing = await runtimeGet<CardSourceImageR441>('cards', buildCardSourceMetaKeyR441(sourceHash)).catch(() => null);
  const now = new Date().toISOString();
  const base: CardSourceImageR441 = existing ?? {
    sourceHash,
    catalogCardId: input.catalogCardId ?? null,
    originalName: input.file.name || `${sourceHash}.${extensionForCardSourceR441('', validated.mime)}`,
    mime: validated.mime,
    extension: extensionForCardSourceR441(input.file.name, validated.mime),
    bytes: validated.sanitizedBlob.size,
    width: validated.width,
    height: validated.height,
    storedAt: now,
    lastUsedAt: null,
    originalChecksum,
    thumbnailRef: input.thumbnailRef ?? null,
  };
  const metadata = mergeCardSourceMetadataR441(base, {
    catalogCardId: input.catalogCardId ?? base.catalogCardId,
    originalName: input.file.name || base.originalName,
    mime: validated.mime,
    extension: extensionForCardSourceR441(input.file.name, validated.mime),
    bytes: validated.sanitizedBlob.size,
    width: validated.width,
    height: validated.height,
    originalChecksum,
    thumbnailRef: input.thumbnailRef ?? base.thumbnailRef,
  });
  if (!existing || existing.originalChecksum !== originalChecksum) {
    await runtimePut('card-source-images', buildCardSourceKeyR441(sourceHash), validated.sanitizedBlob);
  }
  await runtimePut('cards', buildCardSourceMetaKeyR441(sourceHash), metadata);
  return metadata;
}

export async function linkCardSourceToCatalogR441(sourceHash: string, catalogCardId: string | null, thumbnailRef?: string | null) {
  const { runtimeGet, runtimePut } = await import('@/lib/localDatabase');
  const existing = await runtimeGet<CardSourceImageR441>('cards', buildCardSourceMetaKeyR441(sourceHash)).catch(() => null);
  if (!existing) return null;
  const next = mergeCardSourceMetadataR441(existing, { catalogCardId, thumbnailRef: thumbnailRef ?? existing.thumbnailRef });
  await runtimePut('cards', buildCardSourceMetaKeyR441(sourceHash), next);
  return next;
}

export async function loadCardSourceImageR441(sourceHash: string) {
  const { runtimeGet, runtimePut } = await import('@/lib/localDatabase');
  const metadata = await runtimeGet<CardSourceImageR441>('cards', buildCardSourceMetaKeyR441(sourceHash)).catch(() => null);
  if (!metadata) return null;
  const blob = await runtimeGet<Blob>('card-source-images', buildCardSourceKeyR441(sourceHash)).catch(() => null);
  if (!blob) return null;
  const next = mergeCardSourceMetadataR441(metadata, { lastUsedAt: new Date().toISOString() });
  await runtimePut('cards', buildCardSourceMetaKeyR441(sourceHash), next).catch(() => undefined);
  return { metadata: next, blob };
}

export async function loadCardSourceFileR441(sourceHash: string) {
  const source = await loadCardSourceImageR441(sourceHash);
  if (!source) return null;
  const fileName = source.metadata.originalName || `${sourceHash}.${source.metadata.extension}`;
  if (typeof File === 'function') return new File([source.blob], fileName, { type: source.metadata.mime || source.blob.type });
  return Object.assign(source.blob, { name: fileName, lastModified: Date.now() }) as Blob & { name: string; lastModified: number };
}

export async function listCardSourceMetadataR441() {
  const { runtimeList } = await import('@/lib/localDatabase');
  const rows = await runtimeList<CardSourceImageR441>('cards', Number.MAX_SAFE_INTEGER);
  return rows
    .filter((row) => String(row.key).startsWith(CARD_SOURCE_META_KEY_PREFIX_R441))
    .map((row) => row.value)
    .filter((item): item is CardSourceImageR441 => Boolean(item?.sourceHash));
}

export async function removeCardSourceImageR441(sourceHash: string) {
  const { runtimeDelete } = await import('@/lib/localDatabase');
  await Promise.all([
    runtimeDelete('card-source-images', buildCardSourceKeyR441(sourceHash)).catch(() => undefined),
    runtimeDelete('cards', buildCardSourceMetaKeyR441(sourceHash)).catch(() => undefined),
  ]);
}
