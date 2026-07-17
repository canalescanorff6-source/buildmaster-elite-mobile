import { accountDatabaseName } from './accountStorage';

const DB_BASE_NAME = 'buildmaster_runtime_v27_10';
const DB_VERSION = 3;

export type RuntimeStoreName = 'ocr-cache' | 'ocr-corrections' | 'scan-history' | 'diagnostics' | 'image-thumbnails' | 'ocr-queue' | 'cards' | 'builds' | 'formations' | 'matches';

const STORE_NAMES: RuntimeStoreName[] = ['ocr-cache', 'ocr-corrections', 'scan-history', 'diagnostics', 'image-thumbnails', 'ocr-queue', 'cards', 'builds', 'formations', 'matches'];

function openRuntimeDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB indisponível'));
      return;
    }
    const request = window.indexedDB.open(accountDatabaseName(DB_BASE_NAME), DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of STORE_NAMES) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('Falha ao abrir banco local'));
  });
}

export async function runtimeGet<T>(storeName: RuntimeStoreName, key: IDBValidKey): Promise<T | null> {
  const db = await openRuntimeDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).get(key);
    request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error(`Falha ao ler ${storeName}`));
    tx.oncomplete = () => db.close();
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error(`Falha de transação em ${storeName}`)); };
  });
}

export async function runtimePut<T>(storeName: RuntimeStoreName, key: IDBValidKey, value: T): Promise<void> {
  const db = await openRuntimeDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(value, key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error(`Falha ao gravar ${storeName}`)); };
  });
}

export async function runtimeDelete(storeName: RuntimeStoreName, key: IDBValidKey): Promise<void> {
  const db = await openRuntimeDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(key);
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error(`Falha ao excluir de ${storeName}`)); };
  });
}

export async function runtimeList<T>(storeName: RuntimeStoreName, limit = 100): Promise<Array<{ key: IDBValidKey; value: T }>> {
  const db = await openRuntimeDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const results: Array<{ key: IDBValidKey; value: T }> = [];
    const request = store.openCursor(null, 'prev');
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor || results.length >= limit) return;
      results.push({ key: cursor.key, value: cursor.value as T });
      cursor.continue();
    };
    request.onerror = () => reject(request.error ?? new Error(`Falha ao listar ${storeName}`));
    tx.oncomplete = () => { db.close(); resolve(results); };
    tx.onerror = () => { db.close(); reject(tx.error ?? new Error(`Falha de transação em ${storeName}`)); };
  });
}

export async function runtimeTrimStore(storeName: RuntimeStoreName, keep = 120): Promise<void> {
  const entries = await runtimeList<unknown>(storeName, Math.max(keep * 3, keep + 20));
  if (entries.length <= keep) return;
  await Promise.all(entries.slice(keep).map((entry) => runtimeDelete(storeName, entry.key)));
}

export async function migrateLegacyRuntimeData(): Promise<{ migrated: number; skipped: number }> {
  if (typeof window === 'undefined') return { migrated: 0, skipped: 0 };
  let migrated = 0;
  let skipped = 0;
  const legacyKeys = [
    'buildmaster_ocr_scan_history_v27',
    'buildmaster_ocr_corrections_v27',
    'buildmaster_diagnostics_v27'
  ];
  for (const key of legacyKeys) {
    const raw = window.localStorage.getItem(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const target: RuntimeStoreName = key.includes('corrections') ? 'ocr-corrections' : key.includes('diagnostics') ? 'diagnostics' : 'scan-history';
      await runtimePut(target, `legacy:${key}`, parsed);
      window.localStorage.removeItem(key);
      migrated += 1;
    } catch {
      skipped += 1;
    }
  }
  return { migrated, skipped };
}
