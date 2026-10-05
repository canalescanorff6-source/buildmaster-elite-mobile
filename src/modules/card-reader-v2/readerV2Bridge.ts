import type { ReaderV2ReviewDraft, ReaderV2SessionSnapshot } from './readerV2Types';

export type ReaderV2BridgePort<T> = {
  finalize(payload: ReaderV2ReviewDraft): Promise<T> | T;
};

export async function bridgeReaderV2Review<T>(
  draft: ReaderV2ReviewDraft,
  snapshot: ReaderV2SessionSnapshot,
  port: ReaderV2BridgePort<T>,
): Promise<T> {
  if (snapshot.stage !== 'ocrClosed') throw new Error('Reader V2 bridge blocked: OCR is not closed');
  if (snapshot.workerReady) throw new Error('Reader V2 bridge blocked: worker still active');
  if (snapshot.pendingRecognitions > 0) throw new Error('Reader V2 bridge blocked: OCR operations pending');
  if (snapshot.cancelled) throw new Error('Reader V2 bridge blocked: session cancelled');
  return await port.finalize(draft);
}
