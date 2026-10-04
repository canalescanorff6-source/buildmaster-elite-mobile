export type StorageFailure = {
  operation: 'read' | 'write' | 'remove';
  key: string;
  reason: string;
  at: string;
};

const STORAGE_EVENT = 'buildmaster:storage-failure';
const ACCOUNT_PREFIX = 'buildmaster_account_';

function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage ?? null;
  } catch {
    return null;
  }
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

function isQuotaFailure(cause: unknown): boolean {
  const details = cause && typeof cause === 'object' ? cause as { name?: unknown; message?: unknown } : {};
  const name = String(details.name ?? '').toLowerCase();
  const message = String(details.message ?? cause ?? '').toLowerCase();
  return name.includes('quota') || message.includes('quota') || (message.includes('storage') && message.includes('full'));
}

function accountScopePrefix(key: string): string | null {
  if (!key.startsWith(ACCOUNT_PREFIX)) return null;
  const separator = key.lastIndexOf('__');
  if (separator <= ACCOUNT_PREFIX.length) return null;
  return key.slice(0, separator + 2);
}

function releaseLegacyStorage(storage: Storage, protectedKey: string): number {
  const removableMarkers = [
    'buildmaster_history_v24_',
    'buildmaster_ocr_scan_history_v27',
    'buildmaster_diagnostics_v27',
    'buildmaster_update_audit_v1',
    'buildmaster_update_audit_v2',
    'buildmaster_ocr_cache',
    'buildmaster_image_thumbnail'
  ];
  const protectedScope = accountScopePrefix(protectedKey);
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key || key === protectedKey || !removableMarkers.some((marker) => key.includes(marker))) continue;

    const candidateScope = accountScopePrefix(key);
    // Falta de espaço em uma conta nunca autoriza apagar dados de outra conta.
    if (protectedScope && candidateScope && candidateScope !== protectedScope) continue;
    // Uma escrita global/legada também não deve limpar namespaces privados de contas.
    if (!protectedScope && candidateScope) continue;
    keys.push(key);
  }
  for (const key of keys) storage.removeItem(key);
  return keys.length;
}

export function safeStorageGet(key: string): string | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch (cause) {
    reportFailure('read', key, cause);
    return null;
  }
}

export function safeStorageSet(key: string, value: string): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch (cause) {
    if (isQuotaFailure(cause)) {
      try {
        releaseLegacyStorage(storage, key);
        storage.setItem(key, value);
        return true;
      } catch (retryCause) {
        reportFailure('write', key, retryCause);
        return false;
      }
    }
    reportFailure('write', key, cause);
    return false;
  }
}

export function safeStorageRemove(key: string): boolean {
  const storage = getStorage();
  if (!storage) return false;
  try {
    storage.removeItem(key);
    return true;
  } catch (cause) {
    reportFailure('remove', key, cause);
    return false;
  }
}

export function safeStorageEntries(): Array<[string, string]> {
  const storage = getStorage();
  if (!storage) return [];
  try {
    const entries: Array<[string, string]> = [];
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key) continue;
      entries.push([key, storage.getItem(key) ?? '']);
    }
    return entries;
  } catch (cause) {
    reportFailure('read', '*', cause);
    return [];
  }
}

function hasCompatibleJsonShape(value: unknown, fallback: unknown): boolean {
  if (fallback === null || fallback === undefined) return true;
  if (Array.isArray(fallback)) return Array.isArray(value);
  if (typeof fallback === 'object') return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  return typeof value === typeof fallback;
}

export function safeStorageGetJson<T>(key: string, fallback: T): T {
  const raw = safeStorageGet(key);
  if (!raw) return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!hasCompatibleJsonShape(parsed, fallback)) {
      reportFailure('read', key, new Error('Formato JSON incompatível com o dado esperado.'));
      return fallback;
    }
    return parsed as T;
  } catch (cause) {
    // Nunca destruir a única cópia ao detectar corrupção. O valor bruto fica disponível
    // para recuperação/diagnóstico e uma gravação válida posterior poderá substituí-lo.
    reportFailure('read', key, cause instanceof Error ? cause : new Error('JSON local inválido.'));
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
  const storage = getStorage();
  if (!storage) return false;
  const key = `buildmaster-storage-test-${Date.now()}`;
  try {
    storage.setItem(key, '1');
    storage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export const STORAGE_FAILURE_EVENT = STORAGE_EVENT;
