import type TesseractNamespace from 'tesseract.js';
import { runtimeDelete, runtimeGet, runtimePut, runtimeTrimStore } from './localDatabase';
import { getRuntimeOptimizationProfile } from './invisibleOptimizationV3820';

export type OcrFieldKind = 'general' | 'name' | 'nameSparse' | 'singleWord' | 'numeric' | 'numericColumn' | 'position' | 'style' | 'attributes' | 'skills' | 'skillsSparse' | 'table' | 'tableSparse';

export type OcrProgress = {
  label: string;
  status: string;
  progress: number;
};

export type OcrRecognition = {
  text: string;
  confidence: number;
  cached: boolean;
  durationMs: number;
};

type CachedRecognition = Omit<OcrRecognition, 'cached'> & { createdAt: string; version: 3 };
type WorkerLike = TesseractNamespace.Worker;

const OCR_CACHE_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const OCR_RECOGNITION_TIMEOUT_MS = 16_000;
const OCR_WORKER_BOOT_TIMEOUT_MS = 18_000;
const DIGEST_CHUNK_BYTES = 256 * 1024;

let workerPromise: Promise<WorkerLike> | null = null;
let workerInstance: WorkerLike | null = null;
let currentLabel = 'OCR';
let generation = 0;
let pendingRecognitions = 0;
let lastUsedAt = 0;
let releaseTimer: number | null = null;
let operationQueue: Promise<void> = Promise.resolve();
const inFlightRecognitions = new Map<string, Promise<OcrRecognition>>();
const progressListeners = new Set<(progress: OcrProgress) => void>();

function emit(status: string, progress = 0) {
  const payload = { label: currentLabel, status, progress };
  for (const listener of progressListeners) listener(payload);
}

export function subscribeOcrProgress(listener: (progress: OcrProgress) => void) {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
}

function clearReleaseTimer() {
  if (typeof window !== 'undefined' && releaseTimer !== null) window.clearTimeout(releaseTimer);
  releaseTimer = null;
}

async function terminateIdleWorker(): Promise<void> {
  if (pendingRecognitions > 0) return;
  clearReleaseTimer();
  const worker = workerInstance;
  workerInstance = null;
  workerPromise = null;
  if (worker) await worker.terminate().catch(() => undefined);
}

function armIdleWorkerRelease(delayMs = getRuntimeOptimizationProfile().ocrWorkerIdleMs) {
  if (typeof window === 'undefined' || !workerPromise) return;
  clearReleaseTimer();
  releaseTimer = window.setTimeout(() => {
    if (pendingRecognitions > 0) {
      armIdleWorkerRelease(Math.min(15_000, Math.max(3_000, Math.round(delayMs / 4))));
      return;
    }
    void terminateIdleWorker();
  }, Math.max(0, delayMs));
}

export function requestOcrWorkerReleaseWhenIdle(delayMs = 0): void {
  armIdleWorkerRelease(delayMs);
}

async function createReusableWorker(): Promise<WorkerLike> {
  const Tesseract = await import('tesseract.js');
  const worker = await Tesseract.createWorker(['por'], Tesseract.OEM.LSTM_ONLY, {
    workerPath: '/tesseract/worker.min.js',
    corePath: '/tesseract/core',
    langPath: '/tesseract/lang',
    gzip: false,
    logger: (message) => emit(message.status || 'processando', Number(message.progress || 0))
  });
  workerInstance = worker;
  return worker;
}

function workerBootDeadline(promise: Promise<WorkerLike>): Promise<WorkerLike> {
  return new Promise<WorkerLike>((resolve, reject) => {
    let settled = false;
    const timer = globalThis.setTimeout(() => {
      if (settled) return;
      settled = true;
      workerPromise = null;
      workerInstance = null;
      reject(new Error('O motor OCR não conseguiu iniciar no tempo seguro. Tente novamente; o leitor foi reiniciado.'));
    }, OCR_WORKER_BOOT_TIMEOUT_MS);
    promise.then((worker) => {
      if (settled) { void worker.terminate().catch(() => undefined); return; }
      settled = true;
      globalThis.clearTimeout(timer);
      resolve(worker);
    }, (error) => {
      if (settled) return;
      settled = true;
      globalThis.clearTimeout(timer);
      reject(error);
    });
  });
}

async function getWorker(): Promise<WorkerLike> {
  if (!workerPromise) {
    workerPromise = workerBootDeadline(createReusableWorker()).catch((error) => {
      workerPromise = null;
      workerInstance = null;
      throw error;
    });
  }
  return workerPromise;
}

export async function prewarmOcrWorker(): Promise<void> {
  await getWorker();
  armIdleWorkerRelease(Math.max(180_000, getRuntimeOptimizationProfile().ocrWorkerIdleMs));
}

function recognitionDeadline<T>(promise: Promise<T>, worker: WorkerLike, label: string, timeoutMs = OCR_RECOGNITION_TIMEOUT_MS): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    let settled = false;
    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      if (workerInstance === worker) {
        workerInstance = null;
        workerPromise = null;
      }
      void worker.terminate().catch(() => undefined);
      reject(new Error(`${label} excedeu o tempo seguro de leitura. O motor OCR foi reiniciado.`));
    }, Math.max(5_000, timeoutMs));
    promise.then((value) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      resolve(value);
    }, (error) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      reject(error);
    });
  });
}
function enqueueWorkerOperation<T>(operation: () => Promise<T>): Promise<T> {
  const queued = operationQueue.then(operation, operation);
  operationQueue = queued.then(() => undefined, () => undefined);
  return queued;
}

function digestFallbackIdentity(file: File | Blob) {
  const candidate = file as File;
  const descriptor = `${file.size}:${file.type || ''}:${candidate.name || 'blob'}:${Number(candidate.lastModified || 0)}`;
  let hashA = 2166136261;
  let hashB = 0x9e3779b9;
  for (let index = 0; index < descriptor.length; index += 1) {
    const value = descriptor.charCodeAt(index);
    hashA ^= value;
    hashA = Math.imul(hashA, 16777619);
    hashB ^= value + ((index + 1) * 131);
    hashB = Math.imul(hashB, 2246822519);
  }
  return `metadata-${(hashA >>> 0).toString(16)}${(hashB >>> 0).toString(16)}-${file.size}`;
}

export async function fileDigest(file: File | Blob): Promise<string> {
  currentLabel = 'Pré-leitura';
  emit('Preparando assinatura segura da imagem', 0);
  try {
    const useCrypto = typeof crypto !== 'undefined' && Boolean(crypto.subtle);
    const chunkDigests: Uint8Array[] = [];
    let fallbackA = 2166136261;
    let fallbackB = 0x9e3779b9;
    let processed = 0;

    for (let offset = 0; offset < file.size; offset += DIGEST_CHUNK_BYTES) {
      const bytes = new Uint8Array(await file.slice(offset, Math.min(file.size, offset + DIGEST_CHUNK_BYTES)).arrayBuffer());
      if (useCrypto) {
        chunkDigests.push(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)));
      } else {
        for (let index = 0; index < bytes.length; index += 1) {
          const value = bytes[index];
          fallbackA ^= value;
          fallbackA = Math.imul(fallbackA, 16777619);
          fallbackB ^= value + ((processed + index + 1) & 0xffff);
          fallbackB = Math.imul(fallbackB, 2246822519);
        }
      }
      processed += bytes.byteLength;
      emit('Preparando assinatura segura da imagem', file.size > 0 ? Math.min(0.98, processed / file.size) : 0.98);
    }

    if (useCrypto) {
      const descriptor = new TextEncoder().encode(`r535:${file.size}:${file.type || ''}:`);
      const merged = new Uint8Array(descriptor.length + chunkDigests.length * 32);
      merged.set(descriptor, 0);
      let cursor = descriptor.length;
      for (const digest of chunkDigests) {
        merged.set(digest, cursor);
        cursor += digest.byteLength;
      }
      const digest = await crypto.subtle.digest('SHA-256', merged);
      emit('Assinatura segura da imagem pronta', 1);
      return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, '0')).join('');
    }

    emit('Assinatura segura da imagem pronta', 1);
    return `fallback-${(fallbackA >>> 0).toString(16)}${(fallbackB >>> 0).toString(16)}-${file.size}`;
  } catch {
    emit('Assinatura simplificada pronta', 1);
    return digestFallbackIdentity(file);
  }
}

function paramsForKind(kind: OcrFieldKind): Partial<TesseractNamespace.WorkerParams> {
  const PSM = {
    general: '3',
    name: '7',
    nameSparse: '11',
    singleWord: '8',
    numeric: '7',
    numericColumn: '6',
    position: '7',
    style: '7',
    attributes: '6',
    skills: '6',
    skillsSparse: '11',
    table: '6',
    tableSparse: '11'
  } as const;
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÀÃÂÉÊÍÓÔÕÚÇáàãâéêíóôõúç '-.";
  const whitelist: Partial<Record<OcrFieldKind, string>> = {
    numeric: '0123456789/:.-',
    numericColumn: '0123456789',
    position: letters,
    name: letters,
    nameSparse: letters,
    singleWord: letters,
    style: letters
  };
  return {
    tessedit_pageseg_mode: PSM[kind] as TesseractNamespace.PSM,
    tessedit_char_whitelist: whitelist[kind] ?? '',
    preserve_interword_spaces: '1',
    user_defined_dpi: kind === 'name' || kind === 'nameSparse' || kind === 'singleWord' ? '450' : '300',
    ...(kind === 'numeric' || kind === 'numericColumn' ? { classify_bln_numeric_mode: '1' } : {})
  } as Partial<TesseractNamespace.WorkerParams>;
}

function cacheIsFresh(cached: CachedRecognition) {
  const createdAt = Date.parse(cached.createdAt);
  return Number.isFinite(createdAt) && Date.now() - createdAt <= OCR_CACHE_MAX_AGE_MS;
}

async function executeRecognition(
  image: File | Blob,
  options: { label: string; kind: OcrFieldKind; cacheKey: string | null; timeoutMs?: number }
): Promise<OcrRecognition> {
  const started = performance.now();
  const operationGeneration = generation;
  currentLabel = options.label;
  clearReleaseTimer();
  pendingRecognitions += 1;

  try {
    return await enqueueWorkerOperation(async () => {
      const worker = await getWorker();
      if (operationGeneration !== generation) throw new DOMException('Leitura cancelada', 'AbortError');
      await worker.setParameters(paramsForKind(options.kind));
      const result = await recognitionDeadline(worker.recognize(image), worker, options.label, options.timeoutMs);
      if (operationGeneration !== generation) throw new DOMException('Leitura cancelada', 'AbortError');
      const recognition: OcrRecognition = {
        text: String(result.data.text ?? '').trim(),
        confidence: Math.max(0, Math.min(100, Math.round(Number(result.data.confidence) || 0))),
        cached: false,
        durationMs: Math.round(performance.now() - started)
      };
      if (options.cacheKey) {
        const cached: CachedRecognition = { ...recognition, createdAt: new Date().toISOString(), version: 3 };
        delete (cached as Partial<OcrRecognition>).cached;
        void runtimePut('ocr-cache', options.cacheKey, cached)
          .then(() => runtimeTrimStore('ocr-cache', 180))
          .catch(() => undefined);
      }
      return recognition;
    });
  } finally {
    pendingRecognitions = Math.max(0, pendingRecognitions - 1);
    lastUsedAt = Date.now();
    if (pendingRecognitions === 0) armIdleWorkerRelease();
  }
}

export async function recognizeWithOcrWorker(
  image: File | Blob,
  options: {
    label: string;
    kind?: OcrFieldKind;
    cacheKey?: string;
    bypassCache?: boolean;
    timeoutMs?: number;
  }
): Promise<OcrRecognition> {
  const kind = options.kind ?? 'general';
  const cacheKey = options.cacheKey ? `v3:${options.cacheKey}:${kind}` : null;
  if (cacheKey && !options.bypassCache) {
    const cached = await runtimeGet<CachedRecognition>('ocr-cache', cacheKey).catch(() => null);
    if (cached && cacheIsFresh(cached)) {
      return { text: cached.text, confidence: cached.confidence, durationMs: 0, cached: true };
    }
    if (cached) void runtimeDelete('ocr-cache', cacheKey).catch(() => undefined);
    const inFlight = inFlightRecognitions.get(cacheKey);
    if (inFlight) return inFlight;
  }

  const recognition = executeRecognition(image, { label: options.label, kind, cacheKey, timeoutMs: options.timeoutMs });
  if (!cacheKey) return recognition;
  inFlightRecognitions.set(cacheKey, recognition);
  return recognition.finally(() => {
    if (inFlightRecognitions.get(cacheKey) === recognition) inFlightRecognitions.delete(cacheKey);
  });
}

export async function cancelOcrProcessing(): Promise<void> {
  generation += 1;
  clearReleaseTimer();
  inFlightRecognitions.clear();
  const worker = workerInstance;
  workerInstance = null;
  workerPromise = null;
  if (worker) await worker.terminate().catch(() => undefined);
}

export async function releaseOcrWorker(): Promise<void> {
  await operationQueue.catch(() => undefined);
  await terminateIdleWorker();
}

export function getOcrRuntimeState() {
  return {
    ready: Boolean(workerInstance),
    loading: Boolean(workerPromise && !workerInstance),
    generation,
    pendingRecognitions,
    lastUsedAt
  };
}
