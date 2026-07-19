export type StorageFailure = {
  operation: 'read' | 'write' | 'remove';
  key: string;
  reason: string;
  at: string;
};

const STORAGE_EVENT = 'buildmaster:storage-failure';

function storageAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function reportFailure(operation: StorageFailure['operation'], key: string, cause: unknown) {
  if (typeof window === 'undefined') return;
  const detail: StorageFailure = {
    operation,
    key,
    reason: cause instanceof Error ? cause.message : String(cause || 'Falha desconhecida'),
    at: new Date().toISOString()
  };
  window.dispatchEvent(new CustomEvent(STORAGE_EVENT, { detail }));
}

export function safeStorageGet(key: string): string | null {
  if (!storageAvailable()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch (cause) {
    reportFailure('read', key, cause);
    return null;
  }
}

export function safeStorageSet(key: string, value: string): boolean {
  if (!storageAvailable()) return false;
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (cause) {
    reportFailure('write', key, cause);
    return false;
  }
}

export function safeStorageRemove(key: string): boolean {
  if (!storageAvailable()) return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (cause) {
    reportFailure('remove', key, cause);
    return false;
  }
}

export function safeStorageGetJson<T>(key: string, fallback: T): T {
  const raw = safeStorageGet(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    safeStorageRemove(key);
    return fallback;
  }
}

export function safeStorageSetJson(key: string, value: unknown): boolean {
  try {
    return safeStorageSet(key, JSON.stringify(value));
  } catch (cause) {
    reportFailure('write', key, cause);
    return false;
  }
}

export function canWriteLocalStorage(): boolean {
  if (!storageAvailable()) return false;
  const key = `buildmaster-storage-test-${Date.now()}`;
  try {
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export const STORAGE_FAILURE_EVENT = STORAGE_EVENT;
