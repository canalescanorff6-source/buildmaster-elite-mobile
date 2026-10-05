export type ReaderV2Backend = 'classic' | 'v2';

export const READER_V2_BACKEND_STORAGE_KEY = 'buildmaster.reader.backend.r542';

function normalizeBackend(value: unknown): ReaderV2Backend | null {
  return value === 'classic' || value === 'v2' ? value : null;
}

export function readReaderV2Backend(): ReaderV2Backend {
  if (typeof window !== 'undefined') {
    try {
      const stored = normalizeBackend(window.localStorage.getItem(READER_V2_BACKEND_STORAGE_KEY));
      if (stored) return stored;
    } catch {}
  }
  // R542 acceptance build: V2 is the active reader. Classic remains a local rollback.
  return 'v2';
}

export function writeReaderV2Backend(backend: ReaderV2Backend): ReaderV2Backend {
  if (typeof window !== 'undefined') {
    try { window.localStorage.setItem(READER_V2_BACKEND_STORAGE_KEY, backend); } catch {}
  }
  return backend;
}

export function resetReaderV2Backend(): ReaderV2Backend {
  if (typeof window !== 'undefined') {
    try { window.localStorage.removeItem(READER_V2_BACKEND_STORAGE_KEY); } catch {}
  }
  return 'v2';
}
