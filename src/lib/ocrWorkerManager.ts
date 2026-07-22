import type TesseractNamespace from 'tesseract.js';
import { runtimeGet, runtimePut, runtimeTrimStore } from './localDatabase';

export type OcrFieldKind = 'general' | 'name' | 'numeric' | 'position' | 'style' | 'attributes' | 'skills';

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

type CachedRecognition = Omit<OcrRecognition, 'cached'> & { createdAt: string; version: 1 };

type WorkerLike = TesseractNamespace.Worker;

let workerPromise: Promise<WorkerLike> | null = null;
let workerInstance: WorkerLike | null = null;
let currentLabel = 'OCR';
let generation = 0;
const progressListeners = new Set<(progress: OcrProgress) => void>();

function emit(status: string, progress = 0) {
  const payload = { label: currentLabel, status, progress };
  for (const listener of progressListeners) listener(payload);
}

export function subscribeOcrProgress(listener: (progress: OcrProgress) => void) {
  progressListeners.add(listener);
  return () => progressListeners.delete(listener);
}

async function createReusableWorker(): Promise<WorkerLike> {
  const Tesseract = await import('tesseract.js');
  const worker = await Tesseract.createWorker(['por', 'eng'], Tesseract.OEM.LSTM_ONLY, {
    workerPath: '/tesseract/worker.min.js',
    corePath: '/tesseract/core',
    langPath: '/tesseract/lang',
    gzip: true,
    logger: (message) => emit(message.status || 'processando', Number(message.progress || 0))
  });
  workerInstance = worker;
  return worker;
}

async function getWorker(): Promise<WorkerLike> {
  if (!workerPromise) {
    workerPromise = createReusableWorker().catch((error) => {
      workerPromise = null;
      workerInstance = null;
      throw error;
    });
  }
  return workerPromise;
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
    numeric: '7',
    position: '7',
    style: '7',
    attributes: '6',
    skills: '6'
  } as const;
  const whitelist: Partial<Record<OcrFieldKind, string>> = {
    numeric: '0123456789/:.-',
    position: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÀÃÂÉÊÍÓÔÕÚÇáàãâéêíóôõúç',
    name: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÀÃÂÉÊÍÓÔÕÚÇáàãâéêíóôõúç '-.",
    style: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÀÃÂÉÊÍÓÔÕÚÇáàãâéêíóôõúç -",
  };
  return {
    tessedit_pageseg_mode: PSM[kind] as TesseractNamespace.PSM,
    tessedit_char_whitelist: whitelist[kind] ?? '',
    preserve_interword_spaces: '1',
    user_defined_dpi: '300'
  };
}

export async function recognizeWithOcrWorker(
  image: File | Blob,
  options: {
    label: string;
    kind?: OcrFieldKind;
    cacheKey?: string;
    bypassCache?: boolean;
  }
): Promise<OcrRecognition> {
  const started = performance.now();
  const kind = options.kind ?? 'general';
  const cacheKey = options.cacheKey ? `v1:${options.cacheKey}:${kind}` : null;
  if (cacheKey && !options.bypassCache) {
    const cached = await runtimeGet<CachedRecognition>('ocr-cache', cacheKey).catch(() => null);
    if (cached) return { text: cached.text, confidence: cached.confidence, durationMs: 0, cached: true };
  }

  const operationGeneration = generation;
  currentLabel = options.label;
  const worker = await getWorker();
  if (operationGeneration !== generation) throw new DOMException('Leitura cancelada', 'AbortError');
  await worker.setParameters(paramsForKind(kind));
  const result = await worker.recognize(image);
  if (operationGeneration !== generation) throw new DOMException('Leitura cancelada', 'AbortError');
  const recognition: OcrRecognition = {
    text: String(result.data.text ?? '').trim(),
    confidence: Math.max(0, Math.min(100, Math.round(Number(result.data.confidence) || 0))),
    cached: false,
    durationMs: Math.round(performance.now() - started)
  };
  if (cacheKey) {
    const cached: CachedRecognition = { ...recognition, createdAt: new Date().toISOString(), version: 1 };
    delete (cached as Partial<OcrRecognition>).cached;
    void runtimePut('ocr-cache', cacheKey, cached).then(() => runtimeTrimStore('ocr-cache', 180)).catch(() => undefined);
  }
  return recognition;
}

export async function cancelOcrProcessing(): Promise<void> {
  generation += 1;
  const worker = workerInstance;
  workerInstance = null;
  workerPromise = null;
  if (worker) await worker.terminate().catch(() => undefined);
}

export async function releaseOcrWorker(): Promise<void> {
  await cancelOcrProcessing();
}

export function getOcrRuntimeState() {
  return { ready: Boolean(workerInstance), loading: Boolean(workerPromise && !workerInstance), generation };
}
