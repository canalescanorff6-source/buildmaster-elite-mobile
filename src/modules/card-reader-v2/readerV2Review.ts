import type {
  ReaderV2Evidence,
  ReaderV2FieldKey,
  ReaderV2ReviewDraft,
  ReaderV2SessionSnapshot,
} from './readerV2Types';

export type ReaderV2PreFinalConfirmation = {
  playerName: string;
  level: string;
  points: string;
  mainPosition: string;
  uncertainKeys: ReaderV2FieldKey[];
  preview: string | null;
};

function fieldValue(evidence: ReaderV2Evidence, ...keys: ReaderV2FieldKey[]) {
  for (const key of keys) {
    const value = evidence.fields.find((field) => field.key === key)?.value?.trim();
    if (value) return value;
  }
  return '';
}

function addUncertain(list: ReaderV2FieldKey[], key: ReaderV2FieldKey) {
  if (!list.includes(key)) list.push(key);
}

export function assertReaderV2ReviewReady(snapshot: ReaderV2SessionSnapshot) {
  if (snapshot.stage !== 'ocrClosed') {
    throw new Error('A conferência do Reader V2 só pode abrir depois de o OCR ser encerrado.');
  }
  if (snapshot.workerReady) {
    throw new Error('A conferência do Reader V2 não pode abrir com worker OCR ativo.');
  }
  if (snapshot.pendingRecognitions !== 0) {
    throw new Error('A conferência do Reader V2 não pode abrir com reconhecimentos pendentes.');
  }
}

export function buildReaderV2ReviewDraft(
  evidence: ReaderV2Evidence,
  preview: string | null,
): ReaderV2ReviewDraft {
  const playerName = fieldValue(evidence, 'playerName', 'name');
  const level = fieldValue(evidence, 'level');
  const points = fieldValue(evidence, 'points');
  const mainPosition = fieldValue(evidence, 'mainPosition', 'positionGrid');
  const uncertainKeys = [...evidence.uncertainKeys];

  if (!playerName) addUncertain(uncertainKeys, 'playerName');
  if (!level) addUncertain(uncertainKeys, 'level');
  if (!points) addUncertain(uncertainKeys, 'points');
  if (!mainPosition) addUncertain(uncertainKeys, 'mainPosition');

  return {
    playerName,
    level,
    points,
    mainPosition,
    rawText: evidence.rawText,
    fields: evidence.fields.map((field) => ({ ...field })),
    uncertainKeys,
    preview,
  };
}

export function toPreFinalConfirmationR542(draft: ReaderV2ReviewDraft): ReaderV2PreFinalConfirmation {
  return {
    playerName: draft.playerName,
    level: draft.level,
    points: draft.points,
    mainPosition: draft.mainPosition,
    uncertainKeys: [...draft.uncertainKeys],
    preview: draft.preview,
  };
}
