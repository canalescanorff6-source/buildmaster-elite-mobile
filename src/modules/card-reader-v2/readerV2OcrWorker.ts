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
const isRecoverableRecognitionError = (cause: unknown) => Boolean(
  cause && typeof cause === 'object' && (cause as { readerV2Recoverable?: boolean }).readerV2Recoverable === true,
);
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
  let interruptRecognition: (() => void) | null = null;

  async function recycleWorker() {
    const active = worker;
    const pendingWorker = workerPromise;
    worker = null;
    workerPromise = null;

    if (active) {
      await active.terminate();
      return;
    }

    if (pendingWorker) {
      void pendingWorker
        .then((created) => created.terminate())
        .catch(() => undefined);
    }
  }

  async function terminateWorker() {
    if (terminated) return;
    terminated = true;
    await recycleWorker();
  }

  function assertUsable() {
    if (cancelled) throw new Error('Sessão OCR cancelada.');
    if (closed || closing || failed || terminated) throw new Error('Sessão OCR encerrada ou fechada.');
  }

  async function start() {
    assertUsable();
    if (worker) return worker;
    if (workerPromise) return workerPromise;

    stage = 'opening';
    workerPromise = Promise.resolve()
      .then(factory)
      .then(async (created) => {
        if (cancelled || closed || closing || terminated) {
          await Promise.resolve(created.terminate()).catch(() => undefined);
          throw new Error(cancelled ? 'Sessão OCR cancelada.' : 'Sessão OCR encerrada ou fechada.');
        }
        worker = created;
        stage = 'reading';
        return created;
      })
      .catch((cause) => {
        workerPromise = null;
        if (cancelled) {
          stage = 'cancelled';
          throw cause;
        }
        error = errorMessage(cause);
        stage = 'error';
        failed = true;
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
        const interrupted = new Promise<never>((_resolve, reject) => {
          interruptRecognition = () => reject(new Error('Sessão OCR cancelada.'));
        });
        const result = await Promise.race([active.recognize(input, key), interrupted]);
        const text = result.text?.trim() ?? '';
        error = null;
        stage = 'reading';
        return {
          key,
          label: String(key),
          value: text,
          confidence: normalizeConfidence(result.confidence),
          source: 'automatic' as const,
          rawText: result.text ?? '',
        };
      } catch (cause) {
        if (cancelled) throw cause;
        error = errorMessage(cause);

        if (isRecoverableRecognitionError(cause)) {
          stage = 'reading';
          await recycleWorker().catch(() => undefined);
          throw cause;
        }

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
      interruptRecognition = null;
      pendingRecognitions = Math.max(0, pendingRecognitions - 1);
    }
  }

  async function cancel() {
    if (cancelled || closed) return;
    cancelled = true;
    stage = 'cancelled';
    interruptRecognition?.();

    // R543-A: hard-stop primeiro. Não esperar uma fila cujo recognize pode estar travado.
    await terminateWorker().catch(() => undefined);
    await queue.catch(() => undefined);
    stage = 'cancelled';
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
