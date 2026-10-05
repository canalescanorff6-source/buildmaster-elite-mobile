import type { ReaderV2Evidence, ReaderV2Mode, ReaderV2Progress, ReaderV2ReviewDraft, ReaderV2SessionSnapshot, ReaderV2Zone } from './readerV2Types';
import type { ReaderV2ImageSession } from './readerV2ImageSession';
import type { ReaderV2OcrWorkerSession } from './readerV2OcrWorker';
import { readReaderV2Automatic } from './readerV2Automatic';
import { readReaderV2Zones } from './readerV2Zones';
import { buildReaderV2ReviewDraft } from './readerV2Review';
import { mapLegacyCalibrationToReaderV2 } from './readerV2ZoneProfile';

export type ReaderV2LifecycleEvent = 'image_selected' | 'session_opened' | 'worker_started' | 'zone_started' | 'zone_completed' | 'worker_terminated' | 'review_opened';

export function createReaderV2Orchestrator(dependencies: {
  zones: ReaderV2Zone[];
  openImageSession(file: File | Blob): Promise<ReaderV2ImageSession>;
  createWorkerSession(): ReaderV2OcrWorkerSession;
  onProgress?: (progress: ReaderV2Progress) => void;
  onEvent?: (event: ReaderV2LifecycleEvent) => void;
  analysisProbe?: () => void;
}) {
  let file: File | null = null;
  let previewUrl: string | null = null;
  let stage: ReaderV2SessionSnapshot['stage'] = 'idle';
  let sessionId: string | null = null;
  let mode: ReaderV2Mode | null = null;
  let cancelled = false;
  let worker: ReaderV2OcrWorkerSession | null = null;
  let imageSession: ReaderV2ImageSession | null = null;
  let lastEvidence: ReaderV2Evidence | null = null;
  let lastReview: ReaderV2ReviewDraft | null = null;

  const emit = (event: ReaderV2LifecycleEvent) => dependencies.onEvent?.(event);
  const snapshot = (): ReaderV2SessionSnapshot => {
    const workerSnapshot = worker?.snapshot();
    return {
      sessionId,
      mode,
      stage,
      workerReady: workerSnapshot?.workerReady ?? false,
      pendingRecognitions: workerSnapshot?.pendingRecognitions ?? 0,
      cancelled,
      imageSelected: Boolean(file),
    };
  };

  async function select(nextFile: File) {
    if (!nextFile.type?.startsWith('image/')) throw new Error('Selecione uma imagem válida para o Reader V2.');
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(nextFile);
    file = nextFile;
    sessionId = null;
    mode = null;
    cancelled = false;
    stage = 'image-selected';
    lastEvidence = null;
    lastReview = null;
    emit('image_selected');
    return previewUrl;
  }

  async function start(nextMode: ReaderV2Mode, calibration?: Array<Partial<ReaderV2Zone> & { id?: string; name?: string }>) {
    if (!file) throw new Error('Reader V2 precisa de uma imagem selecionada.');
    if (worker || imageSession) throw new Error('Reader V2 já possui uma sessão ativa.');
    sessionId = `r542-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    mode = nextMode;
    cancelled = false;
    stage = 'opening';
    emit('session_opened');
    imageSession = await dependencies.openImageSession(file);
    worker = dependencies.createWorkerSession();
    try {
      await worker.start(sessionId);
      emit('worker_started');
      stage = 'reading';
      const zones = nextMode === 'zones' && calibration ? mapLegacyCalibrationToReaderV2(calibration) : dependencies.zones;
      const onProgress = (progress: ReaderV2Progress) => {
        if (progress.key) emit('zone_started');
        dependencies.onProgress?.(progress);
        if (progress.key) emit('zone_completed');
      };
      lastEvidence = nextMode === 'automatic'
        ? await readReaderV2Automatic({ sessionId, zones, imageSession, worker, onProgress })
        : await readReaderV2Zones({ sessionId, zones, imageSession, worker, onProgress });
      stage = 'closing-ocr';
      await worker.close();
      emit('worker_terminated');
      await imageSession.close();
      worker = null;
      imageSession = null;
      stage = 'ocrClosed';
      lastReview = buildReaderV2ReviewDraft(lastEvidence, previewUrl, snapshot());
      emit('review_opened');
      return { evidence: lastEvidence, review: lastReview, snapshot: snapshot() };
    } catch (cause) {
      const wasCancelled = cancelled;
      await worker?.close().catch(() => undefined);
      await imageSession?.close().catch(() => undefined);
      worker = null;
      imageSession = null;
      stage = wasCancelled ? 'cancelled' : 'error';
      throw cause;
    }
  }

  async function cancel() {
    cancelled = true;
    await worker?.cancel().catch(() => undefined);
    await imageSession?.close().catch(() => undefined);
    worker = null;
    imageSession = null;
    stage = 'cancelled';
  }

  async function close() {
    await worker?.close().catch(() => undefined);
    await imageSession?.close().catch(() => undefined);
    worker = null;
    imageSession = null;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    file = null;
    stage = 'idle';
    sessionId = null;
    mode = null;
    cancelled = false;
    lastEvidence = null;
    lastReview = null;
  }

  return { select, start, cancel, close, snapshot, getEvidence: () => lastEvidence, getReview: () => lastReview };
}
