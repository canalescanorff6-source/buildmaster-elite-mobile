import { accountStorageKey } from '@/lib/accountStorage';
import { runtimeDelete, runtimeGet, runtimePut } from '@/lib/localDatabase';
import { isNativeVaultStorageAvailable, nativeVaultRead, nativeVaultRemove, nativeVaultWrite } from '@/lib/nativeVaultStorage';
import { blobToDataUrl, createImageThumbnail } from '@/modules/images/imageSafety';

const IMAGE_PREFIX = 'buildmaster_squad_mapping_image_v3950';
const RUNTIME_PREFIX = 'squad-mapping:image:';

export type StoredMappingImage = {
  ref: string;
  dataUrl: string;
  bytes: number;
  storedAt: string;
  target: 'native' | 'database';
};

function imageKey(sourceHash: string) {
  return `${RUNTIME_PREFIX}${sourceHash}`;
}

function nativeKey(sourceHash: string) {
  return accountStorageKey(`${IMAGE_PREFIX}:${sourceHash}`);
}

function dataUrlBytes(value: string) {
  const payload = value.split(',')[1] ?? '';
  return Math.round((payload.length * 3) / 4);
}

export async function storeSquadMappingImage(sourceHash: string, blob: Blob): Promise<StoredMappingImage> {
  if (!sourceHash) throw new Error('A imagem não possui identificação segura.');
  const optimized = await createImageThumbnail(blob, 1600);
  const dataUrl = await blobToDataUrl(optimized);
  const bytes = optimized.size || dataUrlBytes(dataUrl);
  const storedAt = new Date().toISOString();
  const ref = imageKey(sourceHash);
  await runtimePut('image-thumbnails', ref, { dataUrl, bytes, storedAt });
  if (isNativeVaultStorageAvailable()) {
    await nativeVaultWrite(nativeKey(sourceHash), JSON.stringify({ dataUrl, bytes, storedAt }));
    return { ref, dataUrl, bytes, storedAt, target: 'native' };
  }
  return { ref, dataUrl, bytes, storedAt, target: 'database' };
}

export async function loadSquadMappingImage(sourceHash: string): Promise<StoredMappingImage | null> {
  if (!sourceHash) return null;
  if (isNativeVaultStorageAvailable()) {
    const raw = await nativeVaultRead(nativeKey(sourceHash)).catch(() => null);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { dataUrl?: string; bytes?: number; storedAt?: string };
        if (parsed.dataUrl?.startsWith('data:image/')) {
          return {
            ref: imageKey(sourceHash),
            dataUrl: parsed.dataUrl,
            bytes: Number(parsed.bytes) || dataUrlBytes(parsed.dataUrl),
            storedAt: String(parsed.storedAt || new Date().toISOString()),
            target: 'native'
          };
        }
      } catch { /* try database fallback */ }
    }
  }
  const local = await runtimeGet<{ dataUrl?: string; bytes?: number; storedAt?: string }>('image-thumbnails', imageKey(sourceHash)).catch(() => null);
  if (!local?.dataUrl?.startsWith('data:image/')) return null;
  return {
    ref: imageKey(sourceHash),
    dataUrl: local.dataUrl,
    bytes: Number(local.bytes) || dataUrlBytes(local.dataUrl),
    storedAt: String(local.storedAt || new Date().toISOString()),
    target: 'database'
  };
}

export async function removeSquadMappingImage(sourceHash: string): Promise<void> {
  if (!sourceHash) return;
  await runtimeDelete('image-thumbnails', imageKey(sourceHash)).catch(() => undefined);
  await nativeVaultRemove(nativeKey(sourceHash)).catch(() => undefined);
}

export async function collectSquadMappingImages(sourceHashes: string[]) {
  const images: Record<string, { dataUrl: string; bytes: number; storedAt: string }> = {};
  for (const sourceHash of Array.from(new Set(sourceHashes.filter(Boolean)))) {
    const stored = await loadSquadMappingImage(sourceHash);
    if (stored) images[sourceHash] = { dataUrl: stored.dataUrl, bytes: stored.bytes, storedAt: stored.storedAt };
  }
  return images;
}

export async function restoreSquadMappingImages(images: Record<string, { dataUrl?: string; bytes?: number; storedAt?: string }>) {
  let restored = 0;
  for (const [sourceHash, image] of Object.entries(images ?? {})) {
    if (!sourceHash || !image.dataUrl?.startsWith('data:image/')) continue;
    const bytes = Number(image.bytes) || dataUrlBytes(image.dataUrl);
    const storedAt = String(image.storedAt || new Date().toISOString());
    await runtimePut('image-thumbnails', imageKey(sourceHash), { dataUrl: image.dataUrl, bytes, storedAt });
    if (isNativeVaultStorageAvailable()) await nativeVaultWrite(nativeKey(sourceHash), JSON.stringify({ dataUrl: image.dataUrl, bytes, storedAt })).catch(() => undefined);
    restored += 1;
  }
  return restored;
}
