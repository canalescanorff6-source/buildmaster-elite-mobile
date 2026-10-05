import type { ReaderV2Evidence, ReaderV2Progress, ReaderV2Zone } from './readerV2Types';
import { readReaderV2Zones } from './readerV2Zones';

type AutomaticImagePort = Parameters<typeof readReaderV2Zones>[0]['imageSession'];
type AutomaticWorkerPort = Parameters<typeof readReaderV2Zones>[0]['worker'];

export async function readReaderV2Automatic(input: {
  sessionId: string;
  zones: ReaderV2Zone[];
  imageSession: AutomaticImagePort;
  worker: AutomaticWorkerPort;
  onProgress?: (progress: ReaderV2Progress) => void;
}): Promise<ReaderV2Evidence> {
  const evidence = await readReaderV2Zones(input);
  return { ...evidence, mode: 'automatic' };
}
