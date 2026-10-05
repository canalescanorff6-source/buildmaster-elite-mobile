import type { ReaderV2ImageSession } from './readerV2ImageSession';
import type { ReaderV2OcrWorkerSession } from './readerV2OcrWorker';
import type { ReaderV2Evidence, ReaderV2Progress, ReaderV2Zone } from './readerV2Types';
import { readReaderV2Zones } from './readerV2Zones';

export const READER_V2_AUTOMATIC_ZONES: ReaderV2Zone[] = [
  { key: 'playerName', label: 'Nome do jogador', x: 0.01, y: 0.00, w: 0.40, h: 0.075, enabled: true },
  { key: 'playstyle', label: 'Estilo de jogo', x: 0.01, y: 0.045, w: 0.44, h: 0.075, enabled: true },
  { key: 'level', label: 'Nível máximo', x: 0.69, y: 0.00, w: 0.30, h: 0.12, enabled: true },
  { key: 'points', label: 'Pontos de progresso', x: 0.67, y: 0.105, w: 0.32, h: 0.13, enabled: true },
  { key: 'mainPosition', label: 'Posição principal', x: 0.04, y: 0.16, w: 0.22, h: 0.10, enabled: true },
  { key: 'impeto', label: 'Ímpeto / booster', x: 0.01, y: 0.285, w: 0.98, h: 0.09, enabled: true },
  { key: 'attributes', label: 'Atributos principais', x: 0.01, y: 0.31, w: 0.98, h: 0.40, enabled: true },
  { key: 'skills', label: 'Habilidades', x: 0.01, y: 0.87, w: 0.98, h: 0.12, enabled: true },
];

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
