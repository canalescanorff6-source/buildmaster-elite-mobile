import { runtimeGet, runtimePut } from '@/lib/localDatabase';
import { pruneSnapshots, type BackupSnapshot } from './syncBackupEngine';

const SNAPSHOT_STORE = 'backup-snapshots' as const;
const SNAPSHOT_KEY = 'versions';

type SnapshotReader = <T>(store: typeof SNAPSHOT_STORE, key: IDBValidKey) => Promise<T | null>;
type SnapshotWriter = <T>(store: typeof SNAPSHOT_STORE, key: IDBValidKey, value: T) => Promise<void>;

export async function readBackupSnapshotsR141(read: SnapshotReader = runtimeGet) {
  const stored = await read<BackupSnapshot[]>(SNAPSHOT_STORE, SNAPSHOT_KEY);
  return pruneSnapshots(Array.isArray(stored) ? stored : []);
}

/** Persiste primeiro e só devolve a coleção adotável depois do commit do IndexedDB. */
export async function persistBackupSnapshotsR141(next: BackupSnapshot[], write: SnapshotWriter = runtimePut) {
  const clean = pruneSnapshots(next);
  await write(SNAPSHOT_STORE, SNAPSHOT_KEY, clean);
  return clean;
}

export function currentDeviceLabelR141(userAgent?: string, platform?: string) {
  const resolvedUserAgent = userAgent ?? (typeof navigator === 'undefined' ? '' : navigator.userAgent);
  const resolvedPlatform = platform ?? (typeof navigator === 'undefined' ? '' : navigator.platform);
  const base = resolvedPlatform || 'Aparelho atual';
  const android = resolvedUserAgent.match(/Android[^;)]*/i)?.[0] || '';
  return `${base}${android ? ` • ${android}` : ''}`.slice(0, 120);
}
