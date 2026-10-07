import type { ReaderV2ImageSession } from './readerV2ImageSession';
import type { ReaderV2OcrWorkerSession } from './readerV2OcrWorker';
import type { ReaderV2Evidence, ReaderV2Progress } from './readerV2Types';
import { READER_V2_DEFAULT_ZONES } from './readerV2ZoneProfile';
import { readReaderV2Zones } from './readerV2Zones';

export const READER_V2_AUTOMATIC_ZONES = READER_V2_DEFAULT_ZONES;

export type ReadReaderV2AutomaticInput = {
  imageSession: Pick<ReaderV2ImageSession, 'withCrop'>;
  workerSession: Pick<ReaderV2OcrWorkerSession, 'recognize'>;
  onProgress?: (progress: ReaderV2Progress) => void;
};

export async function readReaderV2Automatic(input: ReadReaderV2AutomaticInput): Promise<ReaderV2Evidence> {
  const evidence = await readReaderV2Zones({
    imageSession: input.imageSession,
    workerSession: input.workerSession,
    zones: READER_V2_AUTOMATIC_ZONES,
    onProgress: input.onProgress,
  });

  return {
    ...evidence,
    mode: 'automatic',
    fields: evidence.fields.map((field) => ({ ...field, source: 'automatic' as const })),
  };
}
