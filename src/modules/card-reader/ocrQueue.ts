import { runtimeDelete, runtimeGet, runtimeList, runtimePut, runtimeTrimStore } from '@/lib/localDatabase';
import { fileDigest } from '@/lib/ocrWorkerManager';

export type OcrQueueStatus = 'waiting' | 'processing' | 'done' | 'failed';

export type OcrQueueJob = {
  id: string;
  imageHash: string;
  fileName: string;
  mimeType: string;
  size: number;
  blob: Blob;
  status: OcrQueueStatus;
  attempts: number;
  addedAt: string;
  updatedAt: string;
  error?: string;
};

export async function enqueueOcrFile(file: File): Promise<{ job: OcrQueueJob; duplicate: boolean }> {
  const imageHash = await fileDigest(file);
  const existing = (await runtimeList<OcrQueueJob>('ocr-queue', 100).catch(() => []))
    .map((entry) => entry.value)
    .find((job) => job.imageHash === imageHash && job.status !== 'failed');
  if (existing) return { job: existing, duplicate: true };
  const now = new Date().toISOString();
  const job: OcrQueueJob = {
    id: `ocr-job-${Date.now()}-${imageHash.slice(0, 8)}`,
    imageHash,
    fileName: file.name || `print-${Date.now()}.png`,
    mimeType: file.type || 'image/png',
    size: file.size,
    blob: file.slice(0, file.size, file.type),
    status: 'waiting',
    attempts: 0,
    addedAt: now,
    updatedAt: now
  };
  await runtimePut('ocr-queue', job.id, job);
  await runtimeTrimStore('ocr-queue', 30).catch(() => undefined);
  return { job, duplicate: false };
}

export async function listOcrQueue(limit = 30) {
  return (await runtimeList<OcrQueueJob>('ocr-queue', limit).catch(() => []))
    .map((entry) => entry.value)
    .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
}

export async function getOcrQueueJob(id: string) {
  return runtimeGet<OcrQueueJob>('ocr-queue', id);
}

export async function updateOcrQueueJob(id: string, patch: Partial<Pick<OcrQueueJob, 'status' | 'attempts' | 'error'>>) {
  const current = await getOcrQueueJob(id);
  if (!current) return null;
  const next: OcrQueueJob = { ...current, ...patch, updatedAt: new Date().toISOString() };
  await runtimePut('ocr-queue', id, next);
  return next;
}

export async function removeOcrQueueJob(id: string) {
  await runtimeDelete('ocr-queue', id);
}

export function queueJobAsFile(job: OcrQueueJob) {
  return new File([job.blob], job.fileName, { type: job.mimeType, lastModified: Date.parse(job.updatedAt) || Date.now() });
}
