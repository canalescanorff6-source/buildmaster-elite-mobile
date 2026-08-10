import { Capacitor, registerPlugin } from '@capacitor/core';
import { runtimeDelete, runtimeGet, runtimePut } from './localDatabase';

export const BACKGROUND_OCR_VERSION = '38.40-background-resume-1';
const ACTIVE_JOB_KEY = 'background-ocr-active-card-reading';
const LEGACY_ACTIVE_JOB_KEY = 'active-card-reading';
const ACTIVE_JOB_STORE = 'backup-snapshots' as const;

export type BackgroundOcrStage =
  | 'preparing'
  | 'layout'
  | 'full-pass'
  | 'zones'
  | 'finalizing'
  | 'completed'
  | 'failed';

export type BackgroundOcrCheckpoint = {
  version: 1;
  id: string;
  file: Blob;
  fileName: string;
  fileType: string;
  stage: BackgroundOcrStage;
  completedZones: number;
  totalZones: number;
  status: string;
  startedAt: string;
  updatedAt: string;
  shouldResume: boolean;
  lastError?: string;
};

type BackgroundOcrPlugin = {
  start(options: { title: string; message: string }): Promise<{ active: boolean }>;
  update(options: { message: string; progress: number }): Promise<void>;
  stop(): Promise<void>;
};

const NativeBackgroundOcr = registerPlugin<BackgroundOcrPlugin>('BuildMasterBackgroundOcr');

export async function saveBackgroundOcrCheckpoint(
  input: Omit<BackgroundOcrCheckpoint, 'version' | 'updatedAt'>
): Promise<BackgroundOcrCheckpoint> {
  const checkpoint: BackgroundOcrCheckpoint = {
    ...input,
    version: 1,
    updatedAt: new Date().toISOString()
  };
  await runtimePut(ACTIVE_JOB_STORE, ACTIVE_JOB_KEY, checkpoint);
  return checkpoint;
}

export async function updateBackgroundOcrCheckpoint(
  patch: Partial<Omit<BackgroundOcrCheckpoint, 'version' | 'id' | 'file' | 'fileName' | 'fileType' | 'startedAt'>>
): Promise<BackgroundOcrCheckpoint | null> {
  const current = await readBackgroundOcrCheckpoint();
  if (!current) return null;
  const next: BackgroundOcrCheckpoint = {
    ...current,
    ...patch,
    updatedAt: new Date().toISOString()
  };
  await runtimePut(ACTIVE_JOB_STORE, ACTIVE_JOB_KEY, next);
  return next;
}

export async function readBackgroundOcrCheckpoint(): Promise<BackgroundOcrCheckpoint | null> {
  const current = await runtimeGet<BackgroundOcrCheckpoint>(ACTIVE_JOB_STORE, ACTIVE_JOB_KEY).catch(() => null);
  if (current) return current;
  // Migração do hotfix anterior: a leitura ativa era gravada na mesma store
  // da fila manual de prints, fazendo-a aparecer como um item impossível de abrir/remover.
  const legacy = await runtimeGet<BackgroundOcrCheckpoint>('ocr-queue', LEGACY_ACTIVE_JOB_KEY).catch(() => null);
  if (!legacy || legacy.version !== 1 || !legacy.fileName || !legacy.file) return null;
  await runtimePut(ACTIVE_JOB_STORE, ACTIVE_JOB_KEY, legacy).catch(() => undefined);
  await runtimeDelete('ocr-queue', LEGACY_ACTIVE_JOB_KEY).catch(() => undefined);
  return legacy;
}

export async function clearBackgroundOcrCheckpoint(): Promise<void> {
  await Promise.allSettled([
    runtimeDelete(ACTIVE_JOB_STORE, ACTIVE_JOB_KEY),
    runtimeDelete('ocr-queue', LEGACY_ACTIVE_JOB_KEY)
  ]);
}

export function checkpointFile(checkpoint: BackgroundOcrCheckpoint): File {
  return new File([checkpoint.file], checkpoint.fileName, {
    type: checkpoint.fileType || checkpoint.file.type || 'image/png',
    lastModified: Date.parse(checkpoint.updatedAt) || Date.now()
  });
}

export async function startBackgroundOcrProtection(message: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await NativeBackgroundOcr.start({
    title: 'BuildMaster — leitura em andamento',
    message
  }).catch(() => undefined);
}

export async function updateBackgroundOcrProtection(message: string, progress: number): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await NativeBackgroundOcr.update({ message, progress: Math.max(0, Math.min(100, Math.round(progress))) }).catch(() => undefined);
}

export async function stopBackgroundOcrProtection(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await NativeBackgroundOcr.stop().catch(() => undefined);
}
