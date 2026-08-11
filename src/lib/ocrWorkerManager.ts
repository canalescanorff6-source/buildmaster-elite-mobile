import type TesseractNamespace from 'tesseract.js';
import { runtimeDelete, runtimeGet, runtimePut, runtimeTrimStore } from './localDatabase';
import { getRuntimeOptimizationProfile } from './invisibleOptimizationV3820';

export type OcrFieldKind = 'general' | 'name' | 'nameSparse' | 'singleWord' | 'numeric' | 'position' | 'style' | 'attributes' | 'skills' | 'skillsSparse' | 'table' | 'tableSparse';

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
const OCR_RECOGNITION_TIMEOUT_MS = 38_000;
const OCR_WORKER_BOOT_TIMEOUT_MS = 30_000;

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
  // v40.10 r2: o vídeo real no Android mostrou o bloqueio em
  // `loading language traineddata` quando POR+ENG eram inicializados juntos.
  // O leitor por quadrados trabalha com rótulos em português e usa whitelist,
  // histórico e reconciliação de nomes próprios; portanto um único idioma local
  // é suficiente e reduz fortemente a inicialização/memória no WebView.
  const worker = await Tesseract.createWorker(['por'], Tesseract.OEM.LSTM_ONLY, {
    workerPath: '/tesseract/worker.min.js',
    corePath: '/tesseract/core',
    langPath: '/tesseract/lang',
    gzip: true,
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
  // Mantém o worker quente durante o período em que o usuário ajusta os
  // quadrados. Isso tira o custo de bootstrap do botão 'Ler os quadrados'.
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

export async function fileDigest(file: File | Blob): Promise<string> {
  const bytes = await file.arrayBuffer();
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(digest)).map((value) => value.toString(16).padStart(2, '0')).join('');
  }
  let hash = 2166136261;
  const data = new Uint8Array(bytes);
  for (const value of data) {
    hash ^= value;
    hash = Math.imul(hash, 16777619);
  }
  return `fallback-${(hash >>> 0).toString(16)}-${data.length}`;
}

function paramsForKind(kind: OcrFieldKind): Partial<TesseractNamespace.WorkerParams> {
  const PSM = {
    general: '3',
    name: '7',
    nameSparse: '11',
    singleWord: '8',
    numeric: '7',
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
    ...(kind === 'numeric' ? { classify_bln_numeric_mode: '1' } : {})
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
