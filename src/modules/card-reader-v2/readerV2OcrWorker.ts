import type {
  ReaderV2FieldEvidence,
  ReaderV2FieldKey,
  ReaderV2SessionSnapshot,
} from './readerV2Types';

export type ReaderV2WorkerRecognition = {
  text: string;
  confidence?: number;
};

export interface ReaderV2WorkerPort {
  recognize(input: unknown, key?: ReaderV2FieldKey): Promise<ReaderV2WorkerRecognition>;
  terminate(): Promise<void> | void;
}

export type ReaderV2WorkerFactory = () => Promise<ReaderV2WorkerPort> | ReaderV2WorkerPort;

export interface ReaderV2OcrWorkerSession {
  start(): Promise<ReaderV2WorkerPort>;
  recognize(input: unknown, key: ReaderV2FieldKey): Promise<ReaderV2FieldEvidence>;
  cancel(): Promise<void>;
  close(): Promise<void>;
  snapshot(): ReaderV2SessionSnapshot;
}

const errorMessage = (cause: unknown) => cause instanceof Error ? cause.message : String(cause);
const normalizeConfidence = (value: number | undefined) => Math.max(0, Math.min(100, Number.isFinite(value) ? Number(value) : 0));

export function createReaderV2OcrWorkerSession(factory: ReaderV2WorkerFactory): ReaderV2OcrWorkerSession {
  let worker: ReaderV2WorkerPort | null = null;
  let workerPromise: Promise<ReaderV2WorkerPort> | null = null;
  let queue: Promise<void> = Promise.resolve();
  let pendingRecognitions = 0;
  let stage: ReaderV2SessionSnapshot['stage'] = 'idle';
  let cancelled = false;
  let closing = false;
  let closed = false;
  let failed = false;
  let error: string | null = null;
  let terminated = false;

  async function terminateWorker() {
    if (terminated) return;
    terminated = true;
    const active = worker ?? (workerPromise ? await workerPromise.catch(() => null) : null);
    worker = null;
    workerPromise = null;
    if (active) await active.terminate();
  }

  function assertUsable() {
    if (cancelled) throw new Error('Sessão OCR cancelada.');
    if (closed || closing || failed) throw new Error('Sessão OCR encerrada ou fechada.');
  }

  async function start() {
    assertUsable();
    if (worker) return worker;
    if (workerPromise) return workerPromise;

    stage = 'opening';
    workerPromise = Promise.resolve()
      .then(factory)
      .then((created) => {
        worker = created;
        stage = 'reading';
        return created;
      })
      .catch((cause) => {
        error = errorMessage(cause);
        stage = 'error';
        failed = true;
        workerPromise = null;
        throw cause;
      });

    return workerPromise;
  }

  async function recognize(input: unknown, key: ReaderV2FieldKey): Promise<ReaderV2FieldEvidence> {
    assertUsable();
    pendingRecognitions += 1;

    const operation = queue.then(async () => {
      assertUsable();
      const active = await start();
      try {
        const result = await active.recognize(input, key);
        const text = result.text?.trim() ?? '';
        return {
          key,
          label: String(key),
          value: text,
          confidence: normalizeConfidence(result.confidence),
          source: 'automatic' as const,
          rawText: result.text ?? '',
        };
      } catch (cause) {
        error = errorMessage(cause);
        stage = 'error';
        failed = true;
        await terminateWorker();
        throw cause;
      }
    });

    queue = operation.then(() => undefined, () => undefined);
    try {
      return await operation;
    } finally {
      pendingRecognitions = Math.max(0, pendingRecognitions - 1);
    }
  }

  async function cancel() {
    if (cancelled || closed) return;
    cancelled = true;
    stage = 'cancelled';
    await queue.catch(() => undefined);
    await terminateWorker();
  }

  async function close() {
    if (closed) return;
    if (cancelled || failed) {
      await terminateWorker();
      return;
    }
    closing = true;
    stage = 'closing-ocr';
    await queue.catch(() => undefined);
    await terminateWorker();
    closing = false;
    closed = true;
    stage = 'ocrClosed';
  }

  function snapshot(): ReaderV2SessionSnapshot {
    return {
      stage,
      mode: null,
      workerReady: Boolean(worker) && !terminated,
      pendingRecognitions,
      cancelled,
      error,
    };
  }

  return { start, recognize, cancel, close, snapshot };
}
