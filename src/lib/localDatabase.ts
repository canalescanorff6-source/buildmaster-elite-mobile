import { accountDatabaseName } from './accountStorage';
import { safeStorageGet, safeStorageRemove } from './safeLocalStorage';

const DB_BASE_NAME = 'buildmaster_runtime_v27_10';
const DB_VERSION = 6;
const DB_OPEN_TIMEOUT_MS = 3500;
const DB_TRANSACTION_TIMEOUT_MS = 5000;

export type RuntimeStoreName = 'ocr-cache' | 'ocr-corrections' | 'ocr-lexicon' | 'ocr-calibrations' | 'scan-history' | 'diagnostics' | 'image-thumbnails' | 'ocr-queue' | 'cards' | 'builds' | 'formations' | 'matches' | 'backup-snapshots';

const STORE_NAMES: RuntimeStoreName[] = ['ocr-cache', 'ocr-corrections', 'ocr-lexicon', 'ocr-calibrations', 'scan-history', 'diagnostics', 'image-thumbnails', 'ocr-queue', 'cards', 'builds', 'formations', 'matches', 'backup-snapshots'];

function openRuntimeDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB indisponível'));
      return;
    }
    let settled = false;
    const request = window.indexedDB.open(accountDatabaseName(DB_BASE_NAME), DB_VERSION);
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error('Banco local demorou para responder'));
    }, DB_OPEN_TIMEOUT_MS);
    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      reject(error);
    };
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const store of STORE_NAMES) {
        if (!db.objectStoreNames.contains(store)) db.createObjectStore(store);
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      if (settled) { db.close(); return; }
      settled = true;
      window.clearTimeout(timer);
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onblocked = () => fail(new Error('Banco local temporariamente bloqueado'));
    request.onerror = () => fail(request.error ?? new Error('Falha ao abrir banco local'));
  });
}

function transactionTimeout(
  db: IDBDatabase,
  tx: IDBTransaction,
  reject: (reason?: unknown) => void,
  label: string
) {
  return window.setTimeout(() => {
    try { tx.abort(); } catch {}
    db.close();
    reject(new Error(`${label} demorou para responder`));
  }, DB_TRANSACTION_TIMEOUT_MS);
}

export async function runtimeGet<T>(storeName: RuntimeStoreName, key: IDBValidKey): Promise<T | null> {
  const db = await openRuntimeDb();
  return new Promise((resolve, reject) => {
    let settled = false;
    const tx = db.transaction(storeName, 'readonly');
    const request = tx.objectStore(storeName).get(key);
    const timer = transactionTimeout(db, tx, (reason) => { if (!settled) { settled = true; reject(reason); } }, `Leitura de ${storeName}`);
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      callback();
    };
    request.onsuccess = () => finish(() => resolve((request.result as T | undefined) ?? null));
    request.onerror = () => finish(() => reject(request.error ?? new Error(`Falha ao ler ${storeName}`)));
    tx.oncomplete = () => db.close();
    tx.onabort = () => { db.close(); finish(() => reject(tx.error ?? new Error(`Leitura abortada em ${storeName}`))); };
    tx.onerror = () => { db.close(); finish(() => reject(tx.error ?? new Error(`Falha de transação em ${storeName}`))); };
  });
}

export async function runtimePut<T>(storeName: RuntimeStoreName, key: IDBValidKey, value: T): Promise<void> {
  const db = await openRuntimeDb();
  return new Promise((resolve, reject) => {
    let settled = false;
    const tx = db.transaction(storeName, 'readwrite');
    const timer = transactionTimeout(db, tx, (reason) => { if (!settled) { settled = true; reject(reason); } }, `Gravação de ${storeName}`);
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      db.close();
      callback();
    };
    try { tx.objectStore(storeName).put(value, key); }
    catch (error) { finish(() => reject(error)); return; }
    tx.oncomplete = () => finish(resolve);
    tx.onabort = () => finish(() => reject(tx.error ?? new Error(`Gravação abortada em ${storeName}`)));
    tx.onerror = () => finish(() => reject(tx.error ?? new Error(`Falha ao gravar ${storeName}`)));
  });
}

export async function runtimeDelete(storeName: RuntimeStoreName, key: IDBValidKey): Promise<void> {
  const db = await openRuntimeDb();
  return new Promise((resolve, reject) => {
    let settled = false;
    const tx = db.transaction(storeName, 'readwrite');
    const timer = transactionTimeout(db, tx, (reason) => { if (!settled) { settled = true; reject(reason); } }, `Exclusão de ${storeName}`);
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      db.close();
      callback();
    };
    try { tx.objectStore(storeName).delete(key); }
    catch (error) { finish(() => reject(error)); return; }
    tx.oncomplete = () => finish(resolve);
    tx.onabort = () => finish(() => reject(tx.error ?? new Error(`Exclusão abortada em ${storeName}`)));
    tx.onerror = () => finish(() => reject(tx.error ?? new Error(`Falha ao excluir de ${storeName}`)));
  });
}

export async function runtimeList<T>(storeName: RuntimeStoreName, limit = 100): Promise<Array<{ key: IDBValidKey; value: T }>> {
  const db = await openRuntimeDb();
  return new Promise((resolve, reject) => {
    let settled = false;
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const results: Array<{ key: IDBValidKey; value: T }> = [];
    const timer = transactionTimeout(db, tx, (reason) => { if (!settled) { settled = true; reject(reason); } }, `Listagem de ${storeName}`);
    const finish = (callback: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      db.close();
      callback();
    };
    const request = store.openCursor(null, 'prev');
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor || results.length >= limit) return;
      results.push({ key: cursor.key, value: cursor.value as T });
      cursor.continue();
    };
    request.onerror = () => finish(() => reject(request.error ?? new Error(`Falha ao listar ${storeName}`)));
    tx.oncomplete = () => finish(() => resolve(results));
    tx.onabort = () => finish(() => reject(tx.error ?? new Error(`Listagem abortada em ${storeName}`)));
    tx.onerror = () => finish(() => reject(tx.error ?? new Error(`Falha de transação em ${storeName}`)));
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
    const raw = safeStorageGet(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as unknown;
      const target: RuntimeStoreName = key.includes('corrections') ? 'ocr-corrections' : key.includes('diagnostics') ? 'diagnostics' : 'scan-history';
      await runtimePut(target, `legacy:${key}`, parsed);
      safeStorageRemove(key);
      migrated += 1;
    } catch {
      skipped += 1;
    }
  }
  return { migrated, skipped };
}
