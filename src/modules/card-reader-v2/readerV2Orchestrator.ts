import type { ReaderV2ImageSession } from './readerV2ImageSession';
import type { ReaderV2OcrWorkerSession } from './readerV2OcrWorker';
import type {
  ReaderV2Evidence,
  ReaderV2Mode,
  ReaderV2Progress,
  ReaderV2ReviewDraft,
  ReaderV2SessionSnapshot,
  ReaderV2Zone,
} from './readerV2Types';
import type { ReadReaderV2AutomaticInput } from './readerV2Automatic';
import type { ReadReaderV2ZonesInput } from './readerV2Zones';

export type ReaderV2OrchestratorDependencies = {
  openImageSession(file: File | Blob): Promise<ReaderV2ImageSession>;
  createWorkerSession(): ReaderV2OcrWorkerSession;
  readAutomatic(input: ReadReaderV2AutomaticInput): Promise<ReaderV2Evidence>;
  readZones(input: ReadReaderV2ZonesInput): Promise<ReaderV2Evidence>;
  buildReview(evidence: ReaderV2Evidence, preview: string | null): ReaderV2ReviewDraft;
  assertReviewReady(snapshot: ReaderV2SessionSnapshot): void;
  onProgress?: (progress: ReaderV2Progress) => void;
};

export type ReaderV2StartResult = {
  evidence: ReaderV2Evidence;
  review: ReaderV2ReviewDraft;
};

export interface ReaderV2Orchestrator {
  select(file: File | Blob): Promise<void>;
  start(mode: ReaderV2Mode, calibration?: ReaderV2Zone[]): Promise<ReaderV2StartResult>;
  cancel(): Promise<void>;
  close(): void;
  snapshot(): ReaderV2SessionSnapshot;
}

export function createReaderV2Orchestrator(dependencies: ReaderV2OrchestratorDependencies): ReaderV2Orchestrator {
  let selectedFile: File | Blob | null = null;
  let imageSession: ReaderV2ImageSession | null = null;
  let workerSession: ReaderV2OcrWorkerSession | null = null;
  let running = false;
  let state: ReaderV2SessionSnapshot = {
    stage: 'idle',
    mode: null,
    workerReady: false,
    pendingRecognitions: 0,
    cancelled: false,
    error: null,
  };

  function syncFromWorker(stage = state.stage, mode = state.mode): ReaderV2SessionSnapshot {
    const worker = workerSession?.snapshot();
    state = {
      stage,
      mode,
      workerReady: worker?.workerReady ?? false,
      pendingRecognitions: worker?.pendingRecognitions ?? 0,
      cancelled: worker?.cancelled ?? state.cancelled,
      error: worker?.error ?? state.error,
    };
    return state;
  }

  function publish(progress: ReaderV2Progress) {
    syncFromWorker(progress.stage, state.mode);
    dependencies.onProgress?.(progress);
  }

  async function select(file: File | Blob) {
    if (running) throw new Error('Não é possível trocar a imagem enquanto o Reader V2 está lendo.');
    imageSession?.close();
    imageSession = null;
    if (workerSession) await workerSession.close().catch(() => undefined);
    workerSession = null;
    selectedFile = file;
    state = {
      stage: 'image-selected',
      mode: null,
      workerReady: false,
      pendingRecognitions: 0,
      cancelled: false,
      error: null,
    };
  }

  async function start(mode: ReaderV2Mode, calibration?: ReaderV2Zone[]): Promise<ReaderV2StartResult> {
    if (!selectedFile) throw new Error('Selecione uma imagem antes de iniciar o Reader V2.');
    if (running) throw new Error('O Reader V2 já está executando uma leitura.');

    running = true;
    state = { ...state, stage: 'opening', mode, cancelled: false, error: null };

    try {
      imageSession?.close();
      imageSession = await dependencies.openImageSession(selectedFile);
      workerSession = dependencies.createWorkerSession();
      await workerSession.start();
      syncFromWorker('reading', mode);

      const shared = {
        imageSession,
        workerSession,
        onProgress: publish,
      };
      const evidence = mode === 'automatic'
        ? await dependencies.readAutomatic(shared)
        : await dependencies.readZones({ ...shared, zones: calibration });

      state = { ...syncFromWorker('closing-ocr', mode), stage: 'closing-ocr' };
      await workerSession.close();
      const closedSnapshot = syncFromWorker('ocrClosed', mode);
      dependencies.assertReviewReady(closedSnapshot);

      const review = dependencies.buildReview(evidence, imageSession.preview);
      state = { ...closedSnapshot, stage: 'review' };
      running = false;
      return { evidence, review };
    } catch (cause) {
      running = false;
      const message = cause instanceof Error ? cause.message : String(cause);
      if (workerSession) await workerSession.cancel().catch(() => undefined);
      state = {
        ...syncFromWorker('error', mode),
        stage: 'error',
        workerReady: false,
        pendingRecognitions: 0,
        error: message,
      };
      throw cause;
    }
  }

  async function cancel() {
    running = false;
    if (workerSession) await workerSession.cancel().catch(() => undefined);
    imageSession?.close();
    imageSession = null;
    state = {
      ...syncFromWorker('cancelled', state.mode),
      stage: 'cancelled',
      workerReady: false,
      pendingRecognitions: 0,
      cancelled: true,
    };
  }

  function close() {
    running = false;
    imageSession?.close();
    imageSession = null;
    if (workerSession) void workerSession.close().catch(() => undefined);
    workerSession = null;
    selectedFile = null;
    state = {
      stage: 'idle',
      mode: null,
      workerReady: false,
      pendingRecognitions: 0,
      cancelled: false,
      error: null,
    };
  }

  function snapshot() {
    return { ...state };
  }

  return { select, start, cancel, close, snapshot };
}
