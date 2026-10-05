import { openReaderV2ImageSession } from './readerV2ImageSession';
import { createReaderV2OcrWorkerSession } from './readerV2OcrWorker';
import { createReaderV2Orchestrator } from './readerV2Orchestrator';
import { readReaderV2Automatic } from './readerV2Automatic';
import { readReaderV2Zones } from './readerV2Zones';
import { assertReaderV2ReviewReady, buildReaderV2ReviewDraft } from './readerV2Review';
import { createReaderV2TesseractWorkerFactory } from './readerV2TesseractWorker';
import type { ReaderV2Progress } from './readerV2Types';

export function createReaderV2AppOrchestrator(onProgress?: (progress: ReaderV2Progress) => void) {
  const workerFactory = createReaderV2TesseractWorkerFactory();
  return createReaderV2Orchestrator({
    openImageSession: openReaderV2ImageSession,
    createWorkerSession: () => createReaderV2OcrWorkerSession(workerFactory),
    readAutomatic: readReaderV2Automatic,
    readZones: readReaderV2Zones,
    buildReview: buildReaderV2ReviewDraft,
    assertReviewReady: assertReaderV2ReviewReady,
    onProgress,
  });
}
