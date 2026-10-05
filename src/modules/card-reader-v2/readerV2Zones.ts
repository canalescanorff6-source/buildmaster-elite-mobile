import type { ReaderV2ImageSession } from './readerV2ImageSession';
import type { ReaderV2OcrWorkerSession } from './readerV2OcrWorker';
import type {
  ReaderV2Evidence,
  ReaderV2FieldEvidence,
  ReaderV2FieldKey,
  ReaderV2Progress,
  ReaderV2Zone,
} from './readerV2Types';
import { READER_V2_DEFAULT_ZONES } from './readerV2ZoneProfile';

export type ReadReaderV2ZonesInput = {
  imageSession: Pick<ReaderV2ImageSession, 'withCrop'>;
  workerSession: Pick<ReaderV2OcrWorkerSession, 'recognize'>;
  zones?: ReaderV2Zone[];
  onProgress?: (progress: ReaderV2Progress) => void;
};

function countAttributeValues(text: string) {
  const numericTokens = text.match(/\b\d{1,3}\b/g) ?? [];
  return Math.min(26, numericTokens.filter((token) => {
    const value = Number(token);
    return Number.isFinite(value) && value >= 0 && value <= 103;
  }).length);
}

function addUncertain(list: ReaderV2FieldKey[], key: ReaderV2FieldKey) {
  if (!list.includes(key)) list.push(key);
}

const errorMessage = (cause: unknown) => cause instanceof Error ? cause.message : String(cause);

export async function readReaderV2Zones(input: ReadReaderV2ZonesInput): Promise<ReaderV2Evidence> {
  const zones = (input.zones ?? READER_V2_DEFAULT_ZONES).filter((zone) => zone.enabled);
  const fields: ReaderV2FieldEvidence[] = [];
  const uncertainKeys: ReaderV2FieldKey[] = [];
  const total = zones.length;

  for (let index = 0; index < zones.length; index += 1) {
    const zone = zones[index];
    input.onProgress?.({
      stage: 'reading',
      current: index,
      total,
      percent: total ? Math.round((index / total) * 100) : 100,
      label: `Lendo ${zone.label}`,
      fieldKey: zone.key,
    });

    let field: ReaderV2FieldEvidence;
    try {
      const recognized = await input.imageSession.withCrop(zone, (crop) => input.workerSession.recognize(crop, zone.key));
      field = {
        ...recognized,
        key: zone.key,
        label: zone.label,
        source: 'zones',
      };
      if (!field.value.trim()) addUncertain(uncertainKeys, zone.key);
    } catch (cause) {
      field = {
        key: zone.key,
        label: zone.label,
        value: '',
        confidence: 0,
        source: 'zones',
        rawText: '',
        error: errorMessage(cause),
      };
      addUncertain(uncertainKeys, zone.key);
    }

    fields.push(field);
    input.onProgress?.({
      stage: 'reading',
      current: index + 1,
      total,
      percent: total ? Math.round(((index + 1) / total) * 100) : 100,
      label: `${zone.label} concluído`,
      fieldKey: zone.key,
    });
  }

  const attributes = fields.find((field) => field.key === 'attributes');
  const attributesRead = attributes ? countAttributeValues(attributes.value) : 0;
  const attributesExpected = 26;
  if (attributes && attributesRead !== attributesExpected) addUncertain(uncertainKeys, 'attributes');

  const rawText = fields
    .map((field) => field.rawText?.trim() || field.value.trim())
    .filter(Boolean)
    .join('\n');

  return {
    mode: 'zones',
    rawText,
    fields,
    uncertainKeys,
    attributesExpected,
    attributesRead,
  };
}
