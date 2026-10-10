import type { ReaderV2ImageSession } from './readerV2ImageSession';
import type { ReaderV2OcrWorkerSession } from './readerV2OcrWorker';
import type { ReaderV2Evidence, ReaderV2Progress } from './readerV2Types';
import { READER_V2_DEFAULT_ZONES } from './readerV2ZoneProfile';
import { readReaderV2Zones } from './readerV2Zones';
import { mapReaderV2ZoneToFrame } from './readerV2Frame';

export const READER_V2_AUTOMATIC_ZONES = READER_V2_DEFAULT_ZONES;

export type ReadReaderV2AutomaticInput = {
  imageSession: Pick<ReaderV2ImageSession, 'withCrop'> & Partial<Pick<ReaderV2ImageSession,'width'|'height'|'frame'>>;
  workerSession: Pick<ReaderV2OcrWorkerSession, 'recognize'>;
  onProgress?: (progress: ReaderV2Progress) => void;
};

export async function readReaderV2Automatic(input: ReadReaderV2AutomaticInput): Promise<ReaderV2Evidence> {
  let zones=READER_V2_AUTOMATIC_ZONES;
  const {width,height,frame}=input.imageSession;
  if(frame)zones=READER_V2_AUTOMATIC_ZONES.map(zone=>mapReaderV2ZoneToFrame(zone,frame));
  else if(width&&height&&(width/height<.8||width/height>.93)){
    const {CLASSIC_ZONES,TALL_ZONES,LANDSCAPE_ZONES}=await import('../card-reader/singlePrintZonePresets');
    zones=(width>height?LANDSCAPE_ZONES:width/height<.62?TALL_ZONES:CLASSIC_ZONES).map(zone=>({...zone,key:zone.key==='name'?'playerName':zone.key,...(zone.key==='attributes'?{attributeLayout:'labels' as const}: {})}));
  }
  const evidence = await readReaderV2Zones({
    imageSession: input.imageSession,
    workerSession: input.workerSession,
    zones,
    onProgress: input.onProgress,
  });

  return {
    ...evidence,
    mode: 'automatic',
    fields: evidence.fields.map((field) => ({ ...field, source: 'automatic' as const })),
  };
}
