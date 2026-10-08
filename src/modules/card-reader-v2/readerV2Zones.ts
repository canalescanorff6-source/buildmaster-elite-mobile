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
import { recoverReaderV2Identity } from './readerV2IdentityRecovery';

export type ReadReaderV2ZonesInput = {
  imageSession: Pick<ReaderV2ImageSession, 'withCrop'>;
  workerSession: Pick<ReaderV2OcrWorkerSession, 'recognize'>;
  zones?: ReaderV2Zone[];
  onProgress?: (progress: ReaderV2Progress) => void;
};

type AttributeValueStrip = {
  id: 'left' | 'center' | 'right';
  x: number;
  w: number;
  expected: number;
};

const READER_V2_ATTRIBUTE_VALUE_STRIPS: AttributeValueStrip[] = [
  { id: 'left', x: 0.255, w: 0.085, expected: 10 },
  { id: 'center', x: 0.590, w: 0.100, expected: 9 },
  { id: 'right', x: 0.905, w: 0.095, expected: 7 },
];

const errorMessage = (cause: unknown) => cause instanceof Error ? cause.message : String(cause);

function parseAttributeValues(text: string) {
  const numericTokens = text.match(/\b\d{1,3}\b/g) ?? [];
  return numericTokens
    .map((token) => Number(token))
    .filter((value) => Number.isFinite(value) && value >= 1 && value <= 110);
}

function countAttributeValues(text: string) {
  return parseAttributeValues(text).length;
}

function addUncertain(list: ReaderV2FieldKey[], key: ReaderV2FieldKey) {
  if (!list.includes(key)) list.push(key);
}

function firstInteger(value: string) {
  const token = value.match(/\d{1,4}/)?.[0];
  if (!token) return null;
  const numeric = Number(token);
  return Number.isFinite(numeric) ? numeric : null;
}

function validateLevelPointsConsistency(
  fields: ReaderV2FieldEvidence[],
  uncertainKeys: ReaderV2FieldKey[],
) {
  const levelField = fields.find((field) => field.key === 'level');
  const pointsField = fields.find((field) => field.key === 'points');
  if (!levelField || !pointsField) return;

  const level = firstInteger(levelField.value);
  const points = firstInteger(pointsField.value);
  if (level === null || points === null) return;

  if (level < 1) {
    addUncertain(uncertainKeys, 'level');
    return;
  }

  const expectedPoints = (level - 1) * 2;
  if (points !== expectedPoints) {
    addUncertain(uncertainKeys, 'level');
    addUncertain(uncertainKeys, 'points');
  }
}

function minimumConfidence(key: ReaderV2FieldKey) {
  switch (key) {
    case 'playerName': return 45;
    case 'level':
    case 'points':
    case 'mainPosition': return 40;
    case 'playstyle': return 35;
    case 'attributes': return 42;
    case 'skills':
    case 'impeto': return 28;
    default: return 20;
  }
}

function countLetters(value: string) {
  return (value.match(/[A-Za-zÀ-ÖØ-öø-ÿ]/g) ?? []).length;
}

function hasPlausibleNumber(value: string) {
  const tokens = value.match(/\d{1,3}/g) ?? [];
  return tokens.some((token) => {
    const numeric = Number(token);
    return Number.isFinite(numeric) && numeric >= 0 && numeric <= 999;
  });
}

function isSemanticallyPlausible(field: ReaderV2FieldEvidence) {
  const value = field.value.trim();
  if (!value) return false;

  switch (field.key) {
    case 'playerName':
      return countLetters(value) >= 2 && !/\d/.test(value);
    case 'level':
    case 'points':
      return hasPlausibleNumber(value);
    case 'mainPosition':
      return countLetters(value) >= 2 && !/\d/.test(value);
    case 'playstyle':
      return countLetters(value) >= 3;
    default:
      return true;
  }
}

function shouldReviewField(field: ReaderV2FieldEvidence) {
  if (field.error) return true;
  if (!isSemanticallyPlausible(field)) return true;
  return field.confidence < minimumConfidence(field.key);
}

const READER_V2_CRITICAL_RETRY_KEYS = new Set<ReaderV2FieldKey>([
  'playerName',
  'level',
  'points',
  'mainPosition',
  'playstyle',
]);

function isRecoverableFieldError(cause: unknown) {
  return Boolean(
    cause
    && typeof cause === 'object'
    && (cause as { readerV2Recoverable?: boolean }).readerV2Recoverable === true
  );
}

function fieldQualityScore(field: ReaderV2FieldEvidence) {
  const plausible = !field.error && isSemanticallyPlausible(field);
  const textLength = Math.min(80, field.value.trim().length);
  return (plausible ? 10_000 : 0) + Math.round(field.confidence) * 100 + textLength;
}

function preferBetterField(first: ReaderV2FieldEvidence, second: ReaderV2FieldEvidence) {
  return fieldQualityScore(second) > fieldQualityScore(first) ? second : first;
}

function retryRecognitionKey(key: ReaderV2FieldKey): ReaderV2FieldKey {
  return `${String(key)}#retry`;
}

function zoneGeometryKey(zone: ReaderV2Zone) {
  return [zone.x, zone.y, zone.w, zone.h]
    .map((value) => Number(value).toFixed(6))
    .join(':');
}

function reuseZoneField(field: ReaderV2FieldEvidence, zone: ReaderV2Zone): ReaderV2FieldEvidence {
  return {
    ...field,
    key: zone.key,
    label: zone.label,
    source: 'zones',
  };
}

function asZoneField(
  recognized: ReaderV2FieldEvidence,
  zone: ReaderV2Zone,
): ReaderV2FieldEvidence {
  return {
    ...recognized,
    key: zone.key,
    label: zone.label,
    source: 'zones',
  };
}

async function readRegularField(
  input: Pick<ReadReaderV2ZonesInput, 'imageSession' | 'workerSession'>,
  zone: ReaderV2Zone,
): Promise<ReaderV2FieldEvidence> {
  const allowRetry = READER_V2_CRITICAL_RETRY_KEYS.has(zone.key);

  return input.imageSession.withCrop(zone, async (crop) => {
    let first: ReaderV2FieldEvidence | null = null;
    let firstError: unknown = null;

    try {
      first = asZoneField(await input.workerSession.recognize(crop, zone.key), zone);
    } catch (cause) {
      firstError = cause;
      if (!allowRetry || !isRecoverableFieldError(cause)) throw cause;
    }

    if (first && (!allowRetry || !shouldReviewField(first))) return first;

    try {
      const second = asZoneField(await input.workerSession.recognize(crop, retryRecognitionKey(zone.key)), zone);
      return first ? preferBetterField(first, second) : second;
    } catch (cause) {
      if (first) return first;
      throw firstError ?? cause;
    }
  });
}

function attributeStripZone(parent: ReaderV2Zone, strip: AttributeValueStrip): ReaderV2Zone {
  const x = Math.max(0, Math.min(0.999, parent.x + parent.w * strip.x));
  const w = Math.max(0.001, Math.min(1 - x, parent.w * strip.w));
  return {
    key: `attributes-values-${strip.id}`,
    label: `${parent.label} • valores ${strip.id}`,
    x,
    y: parent.y,
    w,
    h: parent.h,
    enabled: true,
  };
}

function mergeAttributeFields(zone: ReaderV2Zone, fields: ReaderV2FieldEvidence[], error?: string): ReaderV2FieldEvidence {
  const text = fields
    .map((field) => field.rawText?.trim() || field.value.trim())
    .filter(Boolean)
    .join('\n');
  const confidence = fields.length
    ? Math.round(fields.reduce((sum, field) => sum + field.confidence, 0) / fields.length)
    : 0;
  return {
    key: 'attributes',
    label: zone.label,
    value: text,
    confidence,
    source: 'zones',
    rawText: text,
    ...(error ? { error } : {}),
  };
}

async function readAttributeField(
  input: Pick<ReadReaderV2ZonesInput, 'imageSession' | 'workerSession'>,
  zone: ReaderV2Zone,
): Promise<ReaderV2FieldEvidence> {
  const stripFields: ReaderV2FieldEvidence[] = [];
  const orderedRows: Array<number | null> = [];
  let hasOrderedRows = false;
  let exact = true;
  let stripError: string | null = null;

  for (const strip of READER_V2_ATTRIBUTE_VALUE_STRIPS) {
    const stripZone = attributeStripZone(zone, strip);
    try {
      const recognized = await input.imageSession.withCrop(
        stripZone,
        (crop) => input.workerSession.recognize(crop, stripZone.key),
      );
      const field: ReaderV2FieldEvidence = {
        ...recognized,
        key: stripZone.key,
        label: stripZone.label,
        source: 'zones',
      };
      stripFields.push(field);
      const rows = field.attributeRows;
      const values = parseAttributeValues(field.value);
      if (!field.error && rows?.length === strip.expected) {
        orderedRows.push(...rows.map(value => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 110 ? value : null));
        hasOrderedRows = true;
      } else if (!field.error && field.confidence >= 42 && values.length === strip.expected) {
        orderedRows.push(...values);
        hasOrderedRows = true;
      } else orderedRows.push(...Array<null>(strip.expected).fill(null));
      if (countAttributeValues(field.value) !== strip.expected) exact = false;
    } catch (cause) {
      exact = false;
      stripError ??= errorMessage(cause);
      orderedRows.push(...Array<null>(strip.expected).fill(null));
    }
  }

  if (hasOrderedRows) {
    const complete = orderedRows.every(value => value !== null);
    return {
      ...mergeAttributeFields(zone, stripFields),
      attributeRows: orderedRows,
      ...(complete ? {attributeValues: orderedRows as number[]} : {}),
    };
  }

  if (exact && stripFields.length === READER_V2_ATTRIBUTE_VALUE_STRIPS.length) {
    return { ...mergeAttributeFields(zone, stripFields), attributeValues: stripFields.flatMap(field => parseAttributeValues(field.value)) };
  }

  try {
    const fallback = await input.imageSession.withCrop(
      zone,
      (crop) => input.workerSession.recognize(crop, 'attributes'),
    );
    return {
      ...fallback,
      key: 'attributes',
      label: zone.label,
      source: 'zones',
    };
  } catch (cause) {
    return mergeAttributeFields(zone, stripFields, stripError ?? errorMessage(cause));
  }
}

export async function readReaderV2Zones(input: ReadReaderV2ZonesInput): Promise<ReaderV2Evidence> {
  const zones = (input.zones ?? READER_V2_DEFAULT_ZONES).filter((zone) => zone.enabled);
  const fields: ReaderV2FieldEvidence[] = [];
  const uncertainKeys: ReaderV2FieldKey[] = [];
  const reusableByGeometry = new Map<string, ReaderV2FieldEvidence>();
  const total = zones.length;

  for (let index = 0; index < zones.length; index += 1) {
    const zone = zones[index];
    input.onProgress?.({
      stage: 'reading',
      current: index,
      total,
      percent: total ? Math.round((index / total) * 90) : 90,
      label: `Lendo ${zone.label}`,
      fieldKey: zone.key,
    });

    let field: ReaderV2FieldEvidence;
    const geometryKey = zone.key === 'attributes' ? null : zoneGeometryKey(zone);
    const reusable = geometryKey ? reusableByGeometry.get(geometryKey) : undefined;

    if (reusable) {
      field = reuseZoneField(reusable, zone);
      if (shouldReviewField(field)) addUncertain(uncertainKeys, zone.key);
    } else {
      try {
        if (zone.key === 'attributes') {
          field = await readAttributeField(input, zone);
        } else {
          field = await readRegularField(input, zone);
        }
        if (geometryKey && !field.error) reusableByGeometry.set(geometryKey, field);
        if (shouldReviewField(field)) addUncertain(uncertainKeys, zone.key);
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
    }

    fields.push(field);
    input.onProgress?.({
      stage: 'reading',
      current: index + 1,
      total,
      percent: total ? Math.round(((index + 1) / total) * 90) : 90,
      label: `${zone.label} concluído`,
      fieldKey: zone.key,
    });
  }

  await recoverReaderV2Identity(fields, uncertainKeys, zones, async zone => {
    input.onProgress?.({stage:'reading',current:total,total,percent:95,label:`Conferindo ${zone.label}`,fieldKey:zone.key});
    try { return await readRegularField(input, zone); }
    catch (cause) { return {key:zone.key,label:zone.label,value:'',confidence:0,source:'zones',error:errorMessage(cause)}; }
  });
  input.onProgress?.({stage:'reading',current:total,total,percent:100,label:'Leitura dos campos concluída'});
  validateLevelPointsConsistency(fields, uncertainKeys);

  const attributes = fields.find((field) => field.key === 'attributes');
  const parsedAttributeValues = attributes ? parseAttributeValues(attributes.value) : [];
  const attributeRows = attributes?.attributeRows;
  const attributesRead = attributeRows ? attributeRows.filter(value => value !== null).length : parsedAttributeValues.length;
  const attributesExpected = 26;
  const attributeValues = attributesRead === attributesExpected ? attributes?.attributeValues : undefined;
  if (attributes && (attributesRead !== attributesExpected || !attributeValues)) addUncertain(uncertainKeys, 'attributes');

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
    attributeValues,
    attributeRows,
  };
}
