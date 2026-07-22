import { accountDatabaseName } from '@/lib/accountStorage';
import { createStableId } from '@/lib/stableId';
import { createImageThumbnail, IMAGE_IMPORT_LIMITS, validateImageFile, type SupportedImageKind } from './imageSafety';

const DB_BASE_NAME = 'buildmaster_tactical_image_library_v1';
const DB_VERSION = 1;
const STORE = 'images';

export type StoredTacticalImage = {
  id: string;
  name: string;
  kind: SupportedImageKind;
  mime: string;
  width: number;
  height: number;
  size: number;
  createdAt: string;
  updatedAt: string;
  favorite: boolean;
  original: Blob;
  thumbnail: Blob;
};

export type TacticalImageSummary = Omit<StoredTacticalImage, 'original' | 'thumbnail'> & { thumbnail: Blob };

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(accountDatabaseName(DB_BASE_NAME), DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Não foi possível abrir a galeria.'));
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore, resolve: (value: T) => void, reject: (reason?: unknown) => void) => void): Promise<T> {
  const db = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const store = transaction.objectStore(STORE);
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => { db.close(); reject(transaction.error || new Error('Falha na galeria.')); };
    transaction.onabort = () => { db.close(); reject(transaction.error || new Error('Operação cancelada.')); };
    action(store, resolve, reject);
  });
}

export async function listTacticalImages(): Promise<TacticalImageSummary[]> {
  return run<TacticalImageSummary[]>('readonly', (store, resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve((request.result as StoredTacticalImage[]).map((stored) => { const { original, ...item } = stored; void original; return item; }).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    request.onerror = () => reject(request.error);
  });
}

export async function getTacticalImage(id: string): Promise<StoredTacticalImage | null> {
  return run<StoredTacticalImage | null>('readonly', (store, resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve((request.result as StoredTacticalImage | undefined) || null);
    request.onerror = () => reject(request.error);
  });
}

export async function addTacticalImage(file: File): Promise<StoredTacticalImage> {
  const validated = await validateImageFile(file);
  const current = await listTacticalImages();
  if (current.length >= IMAGE_IMPORT_LIMITS.maxLibraryItems) throw new Error('A galeria já possui 40 imagens. Apague uma imagem manualmente antes de importar outra.');
  const currentBytes = current.reduce((sum, item) => sum + item.size + item.thumbnail.size, 0);
  const thumbnail = await createImageThumbnail(validated.sanitizedBlob);
  if (currentBytes + validated.size + thumbnail.size > IMAGE_IMPORT_LIMITS.maxLibraryBytes) {
    throw new Error('A galeria atingiu 160 MB. Apague imagens manualmente; o app não remove arquivos antigos sozinho.');
  }
  const now = new Date().toISOString();
  const item: StoredTacticalImage = {
    id: createStableId('tactical-image'),
    name: file.name.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 120) || 'imagem-importada',
    kind: validated.kind,
    mime: validated.mime,
    width: validated.width,
    height: validated.height,
    size: validated.size,
    createdAt: now,
    updatedAt: now,
    favorite: false,
    original: validated.sanitizedBlob,
    thumbnail
  };
  await run<void>('readwrite', (store, resolve, reject) => {
    const request = store.put(item);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
  return item;
}

export async function deleteTacticalImage(id: string): Promise<void> {
  await run<void>('readwrite', (store, resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function exportTacticalImageLibrary(): Promise<Array<Omit<StoredTacticalImage, 'original' | 'thumbnail'> & { originalDataUrl: string; thumbnailDataUrl: string }>> {
  const summaries = await listTacticalImages();
  const output: Array<Omit<StoredTacticalImage, 'original' | 'thumbnail'> & { originalDataUrl: string; thumbnailDataUrl: string }> = [];
  for (const summary of summaries) {
    const item = await getTacticalImage(summary.id);
    if (!item) continue;
    const toDataUrl = (blob: Blob) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const { original, thumbnail, ...metadata } = item;
    output.push({ ...metadata, originalDataUrl: await toDataUrl(original), thumbnailDataUrl: await toDataUrl(thumbnail) });
  }
  return output;
}

type ExportedTacticalImage = Omit<StoredTacticalImage, 'original' | 'thumbnail'> & { originalDataUrl: string; thumbnailDataUrl?: string };

function dataUrlToBlob(dataUrl: string): Blob {
  const match = /^data:([^;,]+)?(;base64)?,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error('Imagem do backup está em formato inválido.');
  const mime = match[1] || 'application/octet-stream';
  const bytes = match[2]
    ? Uint8Array.from(atob(match[3]), (character) => character.charCodeAt(0))
    : new TextEncoder().encode(decodeURIComponent(match[3]));
  return new Blob([bytes], { type: mime });
}

export async function importTacticalImageLibrary(value: unknown): Promise<number> {
  if (!Array.isArray(value)) throw new Error('A galeria de imagens do backup é inválida.');
  if (value.length > IMAGE_IMPORT_LIMITS.maxLibraryItems) throw new Error('O backup ultrapassa o limite de 40 imagens.');
  const prepared: StoredTacticalImage[] = [];
  let totalBytes = 0;
  for (const raw of value as ExportedTacticalImage[]) {
    if (!raw || typeof raw !== 'object' || typeof raw.originalDataUrl !== 'string') continue;
    const originalBlob = dataUrlToBlob(raw.originalDataUrl);
    const file = new File([originalBlob], String(raw.name || 'imagem-restaurada').slice(0, 120), { type: originalBlob.type || String(raw.mime || '') });
    const validated = await validateImageFile(file);
    const thumbnail = await createImageThumbnail(validated.sanitizedBlob);
    totalBytes += validated.size + thumbnail.size;
    if (totalBytes > IMAGE_IMPORT_LIMITS.maxLibraryBytes) throw new Error('A galeria restaurada ultrapassa 160 MB.');
    const now = new Date().toISOString();
    prepared.push({
      id: String(raw.id || createStableId('tactical-image')).slice(0, 180),
      name: file.name,
      kind: validated.kind,
      mime: validated.mime,
      width: validated.width,
      height: validated.height,
      size: validated.size,
      createdAt: Number.isNaN(Date.parse(String(raw.createdAt || ''))) ? now : String(raw.createdAt),
      updatedAt: Number.isNaN(Date.parse(String(raw.updatedAt || ''))) ? now : String(raw.updatedAt),
      favorite: raw.favorite === true,
      original: validated.sanitizedBlob,
      thumbnail
    });
  }
  await run<void>('readwrite', (store, resolve, reject) => {
    const clear = store.clear();
    clear.onerror = () => reject(clear.error);
    clear.onsuccess = () => {
      if (!prepared.length) { resolve(); return; }
      let pending = prepared.length;
      for (const item of prepared) {
        const request = store.put(item);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => { pending -= 1; if (pending === 0) resolve(); };
      }
    };
  });
  return prepared.length;
}

