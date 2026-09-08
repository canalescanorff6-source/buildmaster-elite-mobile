import { readAccountStorage } from '@/lib/accountStorage';

export const BACKUP_STORAGE_JSON_R165_VERSION = '40.80-r165-backup-storage-json-v1' as const;

export function readAccountJsonR141(key: string, fallback: unknown = null) {
  try {
    const raw = readAccountStorage(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
