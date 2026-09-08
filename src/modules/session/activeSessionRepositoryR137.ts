import type {
  AnalysisResult,
  ConnectionProfile,
  ControlProfile,
  GameplayMode,
  Objective,
  PositionCode,
  TacticalFormation,
  TacticalStyle
} from '@/lib/analyzerDomain';
import { readAccountStorage, removeAccountStorage, writeAccountStorage } from '@/lib/accountStorage';
import type { ManualFields } from '@/modules/vault/cardHistoryStore';

export const ACTIVE_SESSION_REPOSITORY_R137_VERSION = '40.80-r137-active-session-repository-v1' as const;
export const ACTIVE_SESSION_MAX_AGE_MS_R137 = 1000 * 60 * 60 * 24 * 7;

export type SessionReadingModeR137 = 'precision' | 'fast';

export type ActiveSessionSnapshotR137 = {
  preview: string | null;
  playerCardImage: string | null;
  fileName: string | null;
  ocrDone: boolean;
  rawText: string;
  objective: Objective;
  targetPosition: PositionCode | 'AUTO';
  cardPositionOverride: PositionCode | 'AUTO';
  playstyleOverride: string;
  defensivePlaystyleOverride: string;
  readingMode: SessionReadingModeR137;
  formation: TacticalFormation;
  teamStyle: TacticalStyle;
  managerId: string;
  gameplayMode: GameplayMode;
  connectionProfile: ConnectionProfile;
  controlProfile: ControlProfile;
  result: AnalysisResult | null;
  draftResult: AnalysisResult | null;
  manualFields: ManualFields;
  manualMode: boolean;
  activeHistoryId: string | null;
  savedAt: number;
};

export type ActiveSessionReadR137 = {
  version: typeof ACTIVE_SESSION_REPOSITORY_R137_VERSION;
  status: 'EMPTY' | 'RESTORED' | 'EXPIRED' | 'INVALID';
  snapshot: Partial<ActiveSessionSnapshotR137> | null;
};

function safeDataImage(value: unknown, maxLength = 700_000) {
  const text = typeof value === 'string' ? value : '';
  return text.startsWith('data:image/') && text.length < maxLength ? text : null;
}

export function readActiveSessionSnapshotR137(storageKey: string, now = Date.now()): ActiveSessionReadR137 {
  try {
    const raw = readAccountStorage(storageKey, { migrateLegacy: false });
    if (!raw) return { version: ACTIVE_SESSION_REPOSITORY_R137_VERSION, status: 'EMPTY', snapshot: null };
    const snapshot = JSON.parse(raw) as Partial<ActiveSessionSnapshotR137>;
    const savedAt = Number(snapshot.savedAt ?? 0);
    if (!Number.isFinite(savedAt) || savedAt <= 0) {
      removeAccountStorage(storageKey);
      return { version: ACTIVE_SESSION_REPOSITORY_R137_VERSION, status: 'INVALID', snapshot: null };
    }
    if (Math.max(0, now - savedAt) >= ACTIVE_SESSION_MAX_AGE_MS_R137) {
      removeAccountStorage(storageKey);
      return { version: ACTIVE_SESSION_REPOSITORY_R137_VERSION, status: 'EXPIRED', snapshot: null };
    }
    return {
      version: ACTIVE_SESSION_REPOSITORY_R137_VERSION,
      status: 'RESTORED',
      snapshot: {
        ...snapshot,
        preview: safeDataImage(snapshot.preview),
        playerCardImage: safeDataImage(snapshot.playerCardImage)
      }
    };
  } catch {
    removeAccountStorage(storageKey);
    return { version: ACTIVE_SESSION_REPOSITORY_R137_VERSION, status: 'INVALID', snapshot: null };
  }
}

export function buildActiveSessionSnapshotR137(input: Omit<ActiveSessionSnapshotR137, 'savedAt' | 'result' | 'draftResult'> & { savedAt?: number }): ActiveSessionSnapshotR137 {
  return {
    ...input,
    preview: safeDataImage(input.preview),
    playerCardImage: safeDataImage(input.playerCardImage),
    // Resultado é derivado e selado; a sessão salva apenas dados de entrada para não reidratar uma autoridade antiga.
    result: null,
    draftResult: null,
    savedAt: Number.isFinite(Number(input.savedAt)) ? Number(input.savedAt) : Date.now()
  };
}

export function writeActiveSessionSnapshotR137(storageKey: string, snapshot: ActiveSessionSnapshotR137) {
  return writeAccountStorage(storageKey, JSON.stringify(snapshot));
}

export function clearActiveSessionSnapshotR137(storageKey: string) {
  return removeAccountStorage(storageKey);
}

// R157 — mesma autoridade de sessão R137, agora com persistência dividida entre metadados e mídia.
export const ACTIVE_SESSION_REPOSITORY_R157_VERSION = '40.80-r157-split-session-persistence-v1' as const;
const PREVIEW_SUFFIX_R157 = '__r157_preview';
const PLAYER_IMAGE_SUFFIX_R157 = '__r157_player_image';

type ActiveSessionMetadataR157 = Omit<ActiveSessionSnapshotR137, 'preview' | 'playerCardImage'> & {
  repositoryVersion: typeof ACTIVE_SESSION_REPOSITORY_R157_VERSION;
};

export type ActiveSessionSplitR157 = {
  metadata: ActiveSessionMetadataR157;
  preview: string | null;
  playerCardImage: string | null;
};

function sessionMediaKeyR157(storageKey: string, suffix: string) {
  return `${storageKey}${suffix}`;
}

export function splitActiveSessionSnapshotR157(snapshot: ActiveSessionSnapshotR137): ActiveSessionSplitR157 {
  const normalized = buildActiveSessionSnapshotR137(snapshot);
  const { preview, playerCardImage, ...metadata } = normalized;
  return {
    metadata: { ...metadata, repositoryVersion: ACTIVE_SESSION_REPOSITORY_R157_VERSION },
    preview,
    playerCardImage
  };
}

export function mergeActiveSessionSnapshotR157(split: ActiveSessionSplitR157): ActiveSessionSnapshotR137 {
  const { repositoryVersion: _repositoryVersion, ...metadata } = split.metadata;
  return buildActiveSessionSnapshotR137({ ...metadata, preview: safeDataImage(split.preview), playerCardImage: safeDataImage(split.playerCardImage) });
}

export function writeActiveSessionMetadataR157(storageKey: string, snapshot: ActiveSessionSnapshotR137): boolean {
  const { metadata } = splitActiveSessionSnapshotR157(snapshot);
  return writeAccountStorage(storageKey, JSON.stringify(metadata));
}

function writeSessionMediaValueR157(storageKey: string, value: string | null): boolean {
  if (value) return writeAccountStorage(storageKey, value);
  return removeAccountStorage(storageKey);
}

export function writeActiveSessionMediaR157(storageKey: string, media: Pick<ActiveSessionSnapshotR137, 'preview' | 'playerCardImage'>): boolean {
  const preview = safeDataImage(media.preview);
  const playerCardImage = safeDataImage(media.playerCardImage);
  const previewOk = writeSessionMediaValueR157(sessionMediaKeyR157(storageKey, PREVIEW_SUFFIX_R157), preview);
  const playerOk = writeSessionMediaValueR157(sessionMediaKeyR157(storageKey, PLAYER_IMAGE_SUFFIX_R157), playerCardImage);
  return previewOk && playerOk;
}

function readSplitSessionMetadataR157(storageKey: string, now: number): ActiveSessionReadR137 | null {
  const raw = readAccountStorage(storageKey, { migrateLegacy: false });
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<ActiveSessionMetadataR157>;
    if (parsed.repositoryVersion && parsed.repositoryVersion !== ACTIVE_SESSION_REPOSITORY_R157_VERSION) {
      clearActiveSessionSnapshotR157(storageKey); return { version: ACTIVE_SESSION_REPOSITORY_R137_VERSION, status: 'INVALID', snapshot: null };
    }
    if (parsed.repositoryVersion !== ACTIVE_SESSION_REPOSITORY_R157_VERSION) return null;
    const savedAt = Number(parsed.savedAt ?? 0);
    if (!Number.isFinite(savedAt) || savedAt <= 0) {
      clearActiveSessionSnapshotR157(storageKey); return { version: ACTIVE_SESSION_REPOSITORY_R137_VERSION, status: 'INVALID', snapshot: null };
    }
    if (Math.max(0, now - savedAt) >= ACTIVE_SESSION_MAX_AGE_MS_R137) {
      clearActiveSessionSnapshotR157(storageKey);
      return { version: ACTIVE_SESSION_REPOSITORY_R137_VERSION, status: 'EXPIRED', snapshot: null };
    }
    const { repositoryVersion: _repositoryVersion, ...metadata } = parsed;
    return {
      version: ACTIVE_SESSION_REPOSITORY_R137_VERSION,
      status: 'RESTORED',
      snapshot: {
        ...metadata,
        preview: safeDataImage(readAccountStorage(sessionMediaKeyR157(storageKey, PREVIEW_SUFFIX_R157), { migrateLegacy: false })),
        playerCardImage: safeDataImage(readAccountStorage(sessionMediaKeyR157(storageKey, PLAYER_IMAGE_SUFFIX_R157), { migrateLegacy: false }))
      }
    };
  } catch {
    return null;
  }
}

export function readActiveSessionSnapshotR157(storageKey: string, now = Date.now()): ActiveSessionReadR137 {
  const split = readSplitSessionMetadataR157(storageKey, now);
  if (split) return split;
  // Compatibilidade: snapshots R137 monolíticos continuam restauráveis e serão convertidos no próximo autosave.
  const legacy = readActiveSessionSnapshotR137(storageKey, now);
  if (legacy.status !== 'RESTORED') {
    removeAccountStorage(sessionMediaKeyR157(storageKey, PREVIEW_SUFFIX_R157));
    removeAccountStorage(sessionMediaKeyR157(storageKey, PLAYER_IMAGE_SUFFIX_R157));
  }
  return legacy;
}

export function clearActiveSessionSnapshotR157(storageKey: string): boolean {
  const metadata = removeAccountStorage(storageKey);
  const preview = removeAccountStorage(sessionMediaKeyR157(storageKey, PREVIEW_SUFFIX_R157));
  const player = removeAccountStorage(sessionMediaKeyR157(storageKey, PLAYER_IMAGE_SUFFIX_R157));
  return metadata && preview && player;
}

export function readActiveSessionBackupPayloadR157(storageKey: string): ActiveSessionSnapshotR137 | null {
  const restored = readActiveSessionSnapshotR157(storageKey);
  if (restored.status !== 'RESTORED' || !restored.snapshot) return null;
  return restored.snapshot as ActiveSessionSnapshotR137;
}

export function writeActiveSessionBackupPayloadR157(storageKey: string, value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const snapshot = buildActiveSessionSnapshotR137(value as ActiveSessionSnapshotR137);
  return writeActiveSessionMediaR157(storageKey, snapshot) && writeActiveSessionMetadataR157(storageKey, snapshot);
}
