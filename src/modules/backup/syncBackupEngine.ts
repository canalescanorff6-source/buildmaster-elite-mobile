import { APP_DATA_VERSION, checksumFor, createBackupEnvelope, inspectDataIntegrity, type BackupEnvelope, type BackupSection } from '@/lib/dataSafety';
import { createStableId } from '@/lib/stableId';

export type BackupSnapshot = {
  id: string;
  createdAt: string;
  label: string;
  deviceLabel: string;
  appVersion: string;
  checksum: string;
  sizeBytes: number;
  recordCount: number;
  sections: number;
  envelope: BackupEnvelope;
};

export type CloudVaultPayload = {
  version: string;
  schema: number;
  updatedAt: string;
  deviceLabel: string;
  items: unknown[];
  fullBackup: BackupEnvelope;
  snapshots: BackupSnapshot[];
};

export type SectionConflict = {
  section: BackupSection;
  localChecksum: string;
  remoteChecksum: string;
  state: 'equal' | 'local-only' | 'remote-only' | 'different';
  recommendation: 'keep-local' | 'keep-remote' | 'merge' | 'none';
};

const MAX_LOCAL_SNAPSHOTS = 8;
const MAX_CLOUD_SNAPSHOTS = 3;
const SECTION_KEYS: BackupSection[] = ['history','settings','calibration','plans','folders','rules','session','evolution','tacticalStudio','customFormations','imageGallery','performance'];

function jsonSize(value: unknown) {
  try { return new Blob([JSON.stringify(value)]).size; } catch { return 0; }
}

function identityFor(item: unknown, index: number) {
  if (!item || typeof item !== 'object') return `primitive:${index}:${checksumFor(item)}`;
  const row = item as Record<string, unknown>;
  return String(row.id || row.saveKey || row.fingerprint || row.key || row.name || row.title || `row:${index}:${checksumFor(item)}`);
}

function updatedAtFor(item: unknown) {
  if (!item || typeof item !== 'object') return 0;
  const row = item as Record<string, unknown>;
  const raw = row.updatedAt || row.savedAt || row.createdAt || row.playedAt || row.observedAt;
  const parsed = raw ? Date.parse(String(raw)) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mergeArrayRecords(local: unknown[], remote: unknown[]) {
  const map = new Map<string, unknown>();
  [...remote, ...local].forEach((item, index) => {
    const id = identityFor(item, index);
    const current = map.get(id);
    if (!current || updatedAtFor(item) >= updatedAtFor(current)) map.set(id, item);
  });
  return [...map.values()];
}

function mergeObjects(local: Record<string, unknown>, remote: Record<string, unknown>): Record<string, unknown> {
  const merged: Record<string, unknown> = { ...remote };
  for (const [key, localValue] of Object.entries(local)) {
    const remoteValue = remote[key];
    if (Array.isArray(localValue) && Array.isArray(remoteValue)) merged[key] = mergeArrayRecords(localValue, remoteValue);
    else if (localValue && typeof localValue === 'object' && !Array.isArray(localValue) && remoteValue && typeof remoteValue === 'object' && !Array.isArray(remoteValue)) merged[key] = mergeObjects(localValue as Record<string, unknown>, remoteValue as Record<string, unknown>);
    else if (localValue !== undefined) merged[key] = localValue;
  }
  return merged;
}

export function compareBackupEnvelopes(local: BackupEnvelope, remote: BackupEnvelope): SectionConflict[] {
  return SECTION_KEYS.map((section) => {
    const localValue = local.sections[section];
    const remoteValue = remote.sections[section];
    const localChecksum = localValue === undefined ? '' : checksumFor(localValue);
    const remoteChecksum = remoteValue === undefined ? '' : checksumFor(remoteValue);
    if (!localChecksum && !remoteChecksum) return { section, localChecksum, remoteChecksum, state: 'equal', recommendation: 'none' as const };
    if (localChecksum === remoteChecksum) return { section, localChecksum, remoteChecksum, state: 'equal', recommendation: 'none' as const };
    if (localChecksum && !remoteChecksum) return { section, localChecksum, remoteChecksum, state: 'local-only', recommendation: 'keep-local' as const };
    if (!localChecksum && remoteChecksum) return { section, localChecksum, remoteChecksum, state: 'remote-only', recommendation: 'keep-remote' as const };
    const canMerge = Array.isArray(localValue) && Array.isArray(remoteValue)
      || Boolean(localValue && remoteValue && typeof localValue === 'object' && typeof remoteValue === 'object');
    return { section, localChecksum, remoteChecksum, state: 'different', recommendation: canMerge ? 'merge' as const : 'keep-local' as const };
  });
}

export function mergeBackupEnvelopes(local: BackupEnvelope, remote: BackupEnvelope): BackupEnvelope {
  const sections: BackupEnvelope['sections'] = {};
  for (const section of SECTION_KEYS) {
    const localValue = local.sections[section];
    const remoteValue = remote.sections[section];
    if (localValue === undefined) sections[section] = remoteValue;
    else if (remoteValue === undefined) sections[section] = localValue;
    else if (Array.isArray(localValue) && Array.isArray(remoteValue)) sections[section] = mergeArrayRecords(localValue, remoteValue);
    else if (localValue && remoteValue && typeof localValue === 'object' && typeof remoteValue === 'object') sections[section] = mergeObjects(localValue as Record<string, unknown>, remoteValue as Record<string, unknown>);
    else sections[section] = local.exportedAt >= remote.exportedAt ? localValue : remoteValue;
  }
  return createBackupEnvelope(sections);
}

export function createBackupSnapshot(envelope: BackupEnvelope, label: string, deviceLabel: string): BackupSnapshot {
  const report = inspectDataIntegrity(envelope.sections);
  return {
    id: createStableId('backup-snapshot'),
    createdAt: new Date().toISOString(),
    label: label.trim().slice(0, 80) || 'Ponto de restauração',
    deviceLabel: deviceLabel.trim().slice(0, 120) || 'Aparelho atual',
    appVersion: APP_DATA_VERSION,
    checksum: envelope.checksum,
    sizeBytes: jsonSize(envelope),
    recordCount: report.totals.records,
    sections: report.totals.sections,
    envelope
  };
}

export function pruneSnapshots(snapshots: BackupSnapshot[], limit = MAX_LOCAL_SNAPSHOTS) {
  const unique = new Map<string, BackupSnapshot>();
  snapshots.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).forEach((snapshot) => {
    if (!unique.has(snapshot.checksum)) unique.set(snapshot.checksum, snapshot);
  });
  return [...unique.values()].slice(0, limit);
}

export function buildCloudVaultPayload(envelope: BackupEnvelope, localSnapshots: BackupSnapshot[], deviceLabel: string): CloudVaultPayload {
  const history = Array.isArray(envelope.sections.history) ? envelope.sections.history : [];
  const currentSnapshot = createBackupSnapshot(envelope, 'Sincronização completa', deviceLabel);
  return {
    version: APP_DATA_VERSION,
    schema: envelope.schema,
    updatedAt: new Date().toISOString(),
    deviceLabel,
    items: history,
    fullBackup: envelope,
    snapshots: pruneSnapshots([currentSnapshot, ...localSnapshots], MAX_CLOUD_SNAPSHOTS)
  };
}

export function normalizeCloudVaultPayload(input: unknown): CloudVaultPayload | null {
  if (!input || typeof input !== 'object') return null;
  const row = input as Partial<CloudVaultPayload> & { items?: unknown[] };
  if (!row.fullBackup || typeof row.fullBackup !== 'object') return null;
  const full = row.fullBackup as BackupEnvelope;
  if (full.app !== 'BuildMaster Elite Tático' || !full.sections) return null;
  return {
    version: String(row.version || full.version || 'desconhecida'),
    schema: Number(row.schema || full.schema || 0),
    updatedAt: String(row.updatedAt || full.exportedAt || new Date().toISOString()),
    deviceLabel: String(row.deviceLabel || 'Outro aparelho'),
    items: Array.isArray(row.items) ? row.items : Array.isArray(full.sections.history) ? full.sections.history : [],
    fullBackup: full,
    snapshots: Array.isArray(row.snapshots) ? row.snapshots.filter((item): item is BackupSnapshot => Boolean(item?.id && item.envelope)) : []
  };
}

export function buildSyncHealth(input: { local: BackupEnvelope; remote?: BackupEnvelope | null; snapshots: BackupSnapshot[]; lastSyncAt?: string | null }) {
  const integrity = inspectDataIntegrity(input.local.sections);
  const conflicts = input.remote ? compareBackupEnvelopes(input.local, input.remote) : [];
  const different = conflicts.filter((item) => item.state === 'different').length;
  const localOnly = conflicts.filter((item) => item.state === 'local-only').length;
  const remoteOnly = conflicts.filter((item) => item.state === 'remote-only').length;
  const lastSyncAge = input.lastSyncAt ? Math.max(0, Math.floor((Date.now() - Date.parse(input.lastSyncAt)) / 86400000)) : null;
  const score = Math.max(0, Math.min(100, integrity.score - different * 4 - (lastSyncAge == null ? 12 : lastSyncAge > 14 ? 10 : lastSyncAge > 7 ? 5 : 0) + Math.min(8, input.snapshots.length * 2)));
  return {
    score,
    status: score >= 90 ? 'Protegido' : score >= 72 ? 'Atenção' : 'Risco',
    integrity,
    conflicts,
    different,
    localOnly,
    remoteOnly,
    lastSyncAge,
    recommendation: different ? 'Revise e mescle as diferenças antes de substituir qualquer dado.' : lastSyncAge == null ? 'Faça a primeira sincronização completa.' : lastSyncAge > 7 ? 'Atualize a cópia em nuvem.' : 'Dados locais e proteção estão em bom estado.'
  };
}

export const LOCAL_SNAPSHOT_STORAGE_KEY = 'buildmaster_full_backup_snapshots_v2900';
export const LAST_FULL_SYNC_STORAGE_KEY = 'buildmaster_last_full_cloud_sync_v2900';
