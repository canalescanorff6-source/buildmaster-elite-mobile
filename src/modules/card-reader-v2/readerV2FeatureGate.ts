import { safeStorageGet, safeStorageRemove, safeStorageSet } from '../../lib/safeLocalStorage';

export type ReaderV2Backend = 'classic' | 'v2';

export const READER_V2_BACKEND_STORAGE_KEY = 'buildmaster.reader.backend.r542';

function normalizeBackend(value: unknown): ReaderV2Backend | null {
  return value === 'classic' || value === 'v2' ? value : null;
}

export function readReaderV2Backend(): ReaderV2Backend {
  const stored = normalizeBackend(safeStorageGet(READER_V2_BACKEND_STORAGE_KEY));
  if (stored) return stored;
  // R542 acceptance build: V2 is the active reader. Classic remains a local rollback.
  return 'v2';
}

export function writeReaderV2Backend(backend: ReaderV2Backend): ReaderV2Backend {
  safeStorageSet(READER_V2_BACKEND_STORAGE_KEY, backend);
  return backend;
}

export function resetReaderV2Backend(): ReaderV2Backend {
  safeStorageRemove(READER_V2_BACKEND_STORAGE_KEY);
  return 'v2';
}
