import { canonicalizeOffensivePlaystyleR124 } from '../../lib/efootball2027PhaseCatalogR124';
import { ATTRIBUTE_INPUTS, type PositionCode } from '../../lib/analyzerDomain';
import { deriveReaderCanonicalEvidenceR549 } from '../../lib/readerCanonicalEvidenceR549';
import { extractCanonicalSkillsFromText } from '../../lib/officialSkillIdentity';
import { parseAttributes } from '../analysis/cardEvidenceParserR130';
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
  pointsSource?: 'print' | 'level' | 'manual';
  preview: string | null;
  mainPosition?: string;
  uncertainKeys?: string[];
};

export function normalizeReaderV2Position(value: string): PositionCode | null {
  const code = value.trim().toUpperCase().match(/^(CF|CA|SS|SA|LWF|PTE|RWF|PTD|LMF|MLE|RMF|MLD|AMF|MAT|CMF|MLG|DMF|VOL|CB|ZC|ZG|LB|LE|RB|LD|GK|GO|GOL)(?:\s+\d{1,3})?$/)?.[1];
  if (!code) return null;
  const aliases: Record<string, PositionCode> = {CA:'CF',SA:'SS',PTE:'LWF',PTD:'RWF',MLE:'LMF',MLD:'RMF',MAT:'AMF',MLG:'CMF',VOL:'DMF',ZC:'CB',ZG:'CB',LE:'LB',LD:'RB',GO:'GK',GOL:'GK'};
  return aliases[code] ?? code as PositionCode;
}

function normalizedText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function labeledNumbers(fields: ReaderV2Evidence['fields'], pattern: RegExp) {
  return [...new Set(fields.flatMap(field => [...normalizedText(field.value).matchAll(pattern)].map(match => match[2] || match[1])))];
}

function reviewedNumber(direct: string, candidates: string[], key: string, uncertain: string[]) {
  const token = direct.trim().match(/^(?:\d{1,3}\s*\/\s*)?(\d{1,3})$/)?.[1] ?? '';
  const distinct = [...new Set([token, ...candidates].filter(Boolean))];
  if (distinct.length > 1) addUncertain(uncertain, key);
  return token || (distinct.length === 1 ? distinct[0] : '');
}

/** Ordem EFHub comprovada pelas três tiras: esquerda 10, centro 9, direita 7. */
export function readerV2ReviewAttributes(draft: ReaderV2ReviewDraft): Record<string, string> {
  if (draft.attributeRows?.length === ATTRIBUTE_INPUTS.length) {
    return Object.fromEntries(ATTRIBUTE_INPUTS.flatMap((item,index) => {
      const value = draft.attributeRows![index];
      return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 110 ? [[item.key,String(value)]] : [];
    }));
  }
  if (draft.uncertainKeys.includes('attributes') || draft.attributeValues?.length !== ATTRIBUTE_INPUTS.length) return {};
  if (draft.attributeValues.some(value => !Number.isInteger(value) || value < 1 || value > 110)) return {};
  return Object.fromEntries(ATTRIBUTE_INPUTS.map((item, index) => [item.key, String(draft.attributeValues![index])]));
}

export function readerV2ReviewRawText(draft: ReaderV2ReviewDraft, confirmed?: {attributes:Record<string,string>;nativeSkills:string[]}): string {
  const attributes = confirmed ? Object.fromEntries(ATTRIBUTE_INPUTS.flatMap(item => {
    const value = confirmed.attributes[item.key]?.trim() ?? '';
    return /^\d{1,3}$/.test(value) && Number(value)>=1 && Number(value)<=110 ? [[item.key,value]] : [];
  })) : readerV2ReviewAttributes(draft);
  const canonical = deriveReaderCanonicalEvidenceR549(draft.fields);
  const skills = confirmed ? confirmed.nativeSkills : canonical.skillValues;
  const source = confirmed ? draft.rawText.split(/\r?\n/).filter(line =>
    !Object.keys(parseAttributes(line)).length && !extractCanonicalSkillsFromText(line).length
    && !/^\s*(?:habilidades\b.*|\d{1,3})\s*$/i.test(line)
  ).join('\n') : draft.rawText;
  const style = fieldValue({fields:draft.fields} as ReaderV2Evidence, 'playstyle');
  return [
    draft.playerName ? `NOME DO JOGADOR: ${draft.playerName}` : '',
    draft.editionIdentity?.cardType ? `TIPO DA CARTA: ${draft.editionIdentity.cardType}` : '',
    draft.editionIdentity?.cardLabel ? `EDIÇÃO: ${draft.editionIdentity.cardLabel}` : '',
    draft.level ? `NÍVEL MÁXIMO: ${draft.level}` : '',
    draft.points ? `PONTOS TOTAIS: ${draft.points}` : '',
    normalizeReaderV2Position(draft.mainPosition) ? `POSIÇÃO PRINCIPAL: ${normalizeReaderV2Position(draft.mainPosition)}` : '',
    style ? `ESTILO DE JOGO OFENSIVO: ${style}` : '',
    skills?.length ? `HABILIDADES JÁ POSSUI: ${skills.join('; ')}` : '',
    canonical.impetoName ? `ÍMPETO: ${canonical.impetoName}` : '',
    ...ATTRIBUTE_INPUTS.flatMap(item => attributes[item.key] ? [`${item.label}: ${attributes[item.key]}`] : []),
    source.trim(),
  ].filter(Boolean).join('\n');
}

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
  const uncertainKeys = [...evidence.uncertainKeys];
  const nameLines = fieldValue(evidence, 'playerName', 'name').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const playerName = nameLines.find(line => !canonicalizeOffensivePlaystyleR124(line))?.replace(/^(?:nome(?: do jogador)?|player name)\s*[:=-]\s*/i, '') ?? '';
  const fields = evidence.fields.map(field => ({...field}));
  const styleLine = nameLines.find(line => canonicalizeOffensivePlaystyleR124(line));
  if (styleLine && !fieldValue(evidence, 'playstyle')) fields.push({key:'playstyle',label:'Estilo de jogo',value:styleLine,confidence:fields.find(field => field.key === 'playerName')?.confidence ?? 0,source:evidence.mode});
  const level = reviewedNumber(fieldValue(evidence, 'level'), labeledNumbers(fields, /\bnivel(?:\s+(?:maximo|max\.?))?\s*[:=\-]?\s*(\d{1,3})(?:\s*\/\s*(\d{1,3}))?/g), 'level', uncertainKeys);
  const readPoints = reviewedNumber(fieldValue(evidence, 'points'), labeledNumbers(fields, /\bpontos(?:\s+(?:de\s+)?(?:progresso|progressao|totais|disponiveis))?\s*[:=\-]\s*(\d{1,3})/g), 'points', uncertainKeys);
  const trustedMaximum = fields.some(field => {
    if (field.error || field.confidence < 80 || /\b(?:atual|current)\b/.test(normalizedText(`${field.label} ${field.value}`))) return false;
    const direct = field.key === 'level' && (/maximo|maximum|\bmax\b/.test(normalizedText(field.label ?? '')) || /^\d{1,3}\s*\/\s*\d{1,3}$/.test(field.value.trim()))
      ? field.value.trim().match(/^(?:\d{1,3}\s*\/\s*)?(\d{1,3})$/)?.[1] : undefined;
    const maximums = labeledNumbers([field], /\bnivel\s+(?:maximo|max\.?)\s*[:=\-]?\s*(\d{1,3})(?:\s*\/\s*(\d{1,3}))?/g);
    return [direct,...maximums].some(value => value === level);
  });
  const derivePoints = !readPoints && trustedMaximum && level && !uncertainKeys.includes('level')
    && Number(level) >= 1 && Number(level) <= 100;
  const points = readPoints || (derivePoints ? String((Number(level) - 1) * 2) : '');
  const pointsSource = readPoints ? 'print' as const : derivePoints ? 'level' as const : undefined;
  const unreadPrintedPoints = fields.some(field => field.key === 'points' && (field.error || field.value.trim()));
  if (derivePoints && !unreadPrintedPoints) {
    const index = uncertainKeys.indexOf('points');
    if (index >= 0) uncertainKeys.splice(index,1);
  }
  const labeledPosition = fields.map(field => normalizedText(field.value).match(/posicao (?:principal|da carta)\s*[:=-]\s*([a-z]{2,3})\b/)?.[1]).find(Boolean) ?? '';
  const mainPosition = normalizeReaderV2Position(fieldValue(evidence, 'mainPosition')) ?? normalizeReaderV2Position(labeledPosition) ?? '';
  const canonical = deriveReaderCanonicalEvidenceR549(fields);
  canonical.uncertainKeys.forEach(key => addUncertain(uncertainKeys,key));
  if (level && points && Number(points) !== (Number(level)-1)*2) {addUncertain(uncertainKeys,'level');addUncertain(uncertainKeys,'points');}

  if (!playerName) addUncertain(uncertainKeys, 'playerName');
  if (!level) addUncertain(uncertainKeys, 'level');
  if (!points) addUncertain(uncertainKeys, 'points');
  if (!mainPosition) addUncertain(uncertainKeys, 'mainPosition');

  return {
    playerName,
    level,
    points,
    pointsSource,
    mainPosition,
    rawText: evidence.rawText,
    fields,
    uncertainKeys,
    attributeValues: evidence.attributeValues ? [...evidence.attributeValues] : undefined,
    attributeRows: evidence.attributeRows ? [...evidence.attributeRows] : undefined,
    skillValues: canonical.skillValues,
    impetoName: canonical.impetoName,
    preview,
  };
}

export function toPreFinalConfirmationR542(draft: ReaderV2ReviewDraft): ReaderV2PreFinalConfirmation {
  return {
    playerName: draft.playerName,
    level: draft.level,
    points: draft.points,
    pointsSource: draft.pointsSource,
    preview: draft.preview,
    mainPosition: draft.mainPosition,
    uncertainKeys: [...draft.uncertainKeys],
  };
}
