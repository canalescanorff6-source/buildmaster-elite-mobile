import type { CardSourceImageR441 } from './cardSourceVaultR441';
import { buildPrintBackupArchiveR441, readPrintBackupArchiveR441 } from './printBackupZipR441';
import {
  buildCardSourceKeyR441,
  buildCardSourceMetaKeyR441,
  listCardSourceMetadataR441,
  loadCardSourceImageR441,
  sha256BytesR441,
} from './cardSourceVaultR441';

export const PRINT_BACKUP_RUNTIME_R441_VERSION = '40.80-r441-print-backup-runtime-v1' as const;

export type PrintBackupRestoreSummaryR441 = {
  restored: number;
  skipped: number;
  conflicts: number;
  unlinked: number;
  total: number;
};

function safeFileNameStampR441(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function createPrintBackupBlobR441() {
  const [metadata, catalogModule, ownedModule] = await Promise.all([
    listCardSourceMetadataR441(),
    import('@/modules/card-catalog/masterCardCatalogStorageR438'),
    import('@/modules/card-catalog/ownedCardCollectionR438'),
  ]);
  const sources: Array<{ metadata: CardSourceImageR441; data: Uint8Array }> = [];
  for (const item of metadata) {
    const source = await loadCardSourceImageR441(item.sourceHash);
    if (!source) continue;
    sources.push({ metadata: source.metadata, data: new Uint8Array(await source.blob.arrayBuffer()) });
  }
  const [catalogLocal, ownedCards] = await Promise.all([
    catalogModule.loadMasterCardCatalogR438(),
    ownedModule.loadOwnedCardCollectionR438(),
  ]);
  const bytes = await buildPrintBackupArchiveR441(sources, { catalogLocal, ownedCards });
  return {
    blob: new Blob([bytes], { type: 'application/zip' }),
    filename: `BuildMaster-Prints-${safeFileNameStampR441()}.zip`,
    count: sources.length,
    totalBytes: sources.reduce((sum, item) => sum + item.data.byteLength, 0),
  };
}

export async function downloadPrintBackupR441() {
  const backup = await createPrintBackupBlobR441();
  const url = URL.createObjectURL(backup.blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = backup.filename;
    anchor.click();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return backup;
}

export async function restorePrintBackupBlobR441(blob: Blob): Promise<PrintBackupRestoreSummaryR441> {
  const archive = await readPrintBackupArchiveR441(new Uint8Array(await blob.arrayBuffer()));
  const [{ runtimeGet, runtimePut }, { validateImageFile }, catalogModule] = await Promise.all([
    import('@/lib/localDatabase'),
    import('@/modules/images/imageSafety'),
    import('@/modules/card-catalog/masterCardCatalogStorageR438'),
  ]);
  const knownCatalogIds = new Set((await catalogModule.loadMasterCardCatalogR438()).map((card) => card.catalogCardId));
  let restored = 0;
  let skipped = 0;
  let conflicts = 0;
  let unlinked = 0;

  for (const item of archive.manifest.entries) {
    const data = archive.files.get(item.sourceHash);
    if (!data) { conflicts += 1; continue; }
    const existing = await runtimeGet<CardSourceImageR441>('cards', buildCardSourceMetaKeyR441(item.sourceHash)).catch(() => null);
    if (existing?.originalChecksum === item.checksum) { skipped += 1; continue; }
    if (existing && existing.originalChecksum !== item.checksum) { conflicts += 1; continue; }

    const rawBlob = new Blob([data], { type: item.mime });
    const file = typeof File === 'function'
      ? new File([rawBlob], item.originalName || `${item.sourceHash}.${String(item.file).split('.').pop() || 'bin'}`, { type: item.mime })
      : Object.assign(rawBlob, { name: item.originalName || item.sourceHash, lastModified: Date.now() }) as File;
    const validated = await validateImageFile(file);
    const checksum = await sha256BytesR441(validated.sanitizedBlob);
    if (checksum !== item.checksum) { conflicts += 1; continue; }

    const catalogCardId = item.catalogCardId && knownCatalogIds.has(item.catalogCardId) ? item.catalogCardId : null;
    if (!catalogCardId) unlinked += 1;
    const metadata: CardSourceImageR441 = {
      sourceHash: item.sourceHash,
      catalogCardId,
      originalName: item.originalName,
      mime: item.mime,
      extension: String(item.file).split('.').pop()?.toLowerCase() || 'bin',
      bytes: validated.sanitizedBlob.size,
      width: item.width,
      height: item.height,
      storedAt: item.storedAt || new Date().toISOString(),
      lastUsedAt: null,
      originalChecksum: checksum,
      thumbnailRef: null,
    };
    await runtimePut('card-source-images', buildCardSourceKeyR441(item.sourceHash), validated.sanitizedBlob);
    await runtimePut('cards', buildCardSourceMetaKeyR441(item.sourceHash), metadata);
    restored += 1;
  }
  return { restored, skipped, conflicts, unlinked, total: archive.manifest.entries.length };
}
