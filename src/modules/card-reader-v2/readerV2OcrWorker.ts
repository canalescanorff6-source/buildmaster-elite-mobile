import type { ReaderV2FieldEvidence, ReaderV2SessionSnapshot } from './readerV2Types';

export type ReaderV2WorkerPort = {
  recognize(input: unknown): Promise<{ text?: string; confidence?: number } | string>;
  terminate(): Promise<void> | void;
};

export type ReaderV2WorkerFactory = () => Promise<ReaderV2WorkerPort> | ReaderV2WorkerPort;
export type ReaderV2OcrWorkerSession = ReturnType<typeof createReaderV2OcrWorkerSession>;

export function createReaderV2OcrWorkerSession(factory: ReaderV2WorkerFactory) {
  let worker: ReaderV2WorkerPort | null = null;
  let workerPromise: Promise<ReaderV2WorkerPort> | null = null;
  let queue = Promise.resolve();
  let pendingRecognitions = 0;
  let cancelled = false;
  let closed = false;
  let sessionId: string | null = null;

  const snapshot = (): ReaderV2SessionSnapshot => ({
    sessionId,
    mode: null,
    stage: closed ? 'ocrClosed' : cancelled ? 'cancelled' : worker ? 'reading' : 'idle',
    workerReady: Boolean(worker) && !closed && !cancelled,
    pendingRecognitions,
    cancelled,
    imageSelected: false,
  });

  async function start(nextSessionId = `r542-${Date.now()}`) {
    if (closed) throw new Error('Reader V2 OCR session already closed');
    if (cancelled) throw new Error('Reader V2 OCR session cancelled');
    sessionId = sessionId ?? nextSessionId;
    if (worker) return worker;
    if (!workerPromise) {
      workerPromise = Promise.resolve(factory()).then((created) => {
        worker = created;
        return created;
      }).catch((cause) => {
        workerPromise = null;
        throw cause;
      });
    }
    return workerPromise;
  }

  async function recognize(input: unknown, key: string): Promise<ReaderV2FieldEvidence> {
    if (closed || cancelled) throw new Error('Reader V2 OCR session is not active');
    const task = async () => {
      if (closed || cancelled) throw new Error('Reader V2 OCR session is not active');
      const active = await start();
      pendingRecognitions += 1;
      try {
        const result = await active.recognize(input);
        const text = typeof result === 'string' ? result : result.text ?? '';
        const confidence = typeof result === 'string' ? (text.trim() ? 100 : 0) : Number(result.confidence ?? (text.trim() ? 100 : 0));
        return { key, label: key, value: text.trim(), rawText: text, confidence, uncertain: !text.trim() || confidence < 60 };
      } finally {
        pendingRecognitions = Math.max(0, pendingRecognitions - 1);
      }
    };
    const next = queue.then(task, task);
    queue = next.then(() => undefined, () => undefined);
    return next;
  }

  async function terminateWorker() {
    const active = worker ?? (workerPromise ? await workerPromise.catch(() => null) : null);
    worker = null;
    workerPromise = null;
    if (active) await active.terminate();
  }

  async function close() {
    if (closed) return;
    await queue.catch(() => undefined);
    closed = true;
    await terminateWorker();
    pendingRecognitions = 0;
  }

  async function cancel() {
    if (cancelled || closed) return;
    cancelled = true;
    await queue.catch(() => undefined);
    await terminateWorker();
    pendingRecognitions = 0;
  }

  return { start, recognize, cancel, close, snapshot };
}
