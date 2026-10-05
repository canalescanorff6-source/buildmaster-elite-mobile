export type ReaderV2Backend = 'classic' | 'v2';
export const READER_V2_BACKEND_KEY = 'buildmaster.reader.backend.r542';

export function readReaderV2Backend(): ReaderV2Backend {
  if (typeof window === 'undefined') return 'classic';
  const stored = window.localStorage.getItem(READER_V2_BACKEND_KEY);
  if (stored === 'classic' || stored === 'v2') return stored;
  return /Android/i.test(window.navigator.userAgent) ? 'v2' : 'classic';
}

export function writeReaderV2Backend(value: ReaderV2Backend): ReaderV2Backend {
  if (typeof window !== 'undefined') window.localStorage.setItem(READER_V2_BACKEND_KEY, value);
  return value;
}
