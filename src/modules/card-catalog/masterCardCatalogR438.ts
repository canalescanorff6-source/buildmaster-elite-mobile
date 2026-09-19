import type { AttributeKey, PositionCode } from '@/lib/analyzerDomain';
import { inferPointsFromCardLevel } from '@/modules/builds/pointBudget';

export const MASTER_CARD_CATALOG_R438_VERSION = '40.80-r438-master-card-catalog-v1' as const;

export type MasterCardCompletenessR438 = 'IDENTITY_ONLY' | 'PARTIAL' | 'COMPLETE';
export type MasterCardSourceR438 = 'MIGRATED_SQUAD_MAPPING' | 'OCR_IMPORT' | 'MANUAL' | 'CATALOG_PATCH';
export type MasterCardImpetoR438 = { name: string; value?: number | null; active?: boolean };

export type MasterCardCatalogEntryR438 = {
  schemaVersion: 1;
  catalogCardId: string;
  cardFingerprint: string;
  playerFingerprint: string;
  playerName: string;
  cardLabel: string;
  cardType: string;
  specialTag: string | null;
  country: string | null;
  releaseDate: string | null;
  mainPosition: PositionCode;
  positions: PositionCode[];
  positionRatings: Partial<Record<PositionCode, number>>;
  playstyle: string | null;
  offensivePlaystyle: string | null;
  defensivePlaystyle: string | null;
  defensivePlaystyleConfirmed: boolean;
  overall: number | null;
  level: number | null;
  trainingPointsTotal: number | null;
  attributes: Partial<Record<AttributeKey, number>>;
  nativeSkills: string[];
  additionalSkills: string[];
  specialSkills: string[];
  unclassifiedSkills: string[];
  skillInventoryConfirmed: boolean;
  impetos: MasterCardImpetoR438[];
  boosters: string[];
  height: number | null;
  weight: number | null;
  age: number | null;
  condition: {
    weakFootFrequency?: string | null;
    weakFootAccuracy?: string | null;
    form?: string | null;
    injuryResistance?: string | null;
  };
  physicalProfile: Record<string, number | null>;
  imageRef: string | null;
  portraitRef: string | null;
  sourceHash: string | null;
  visualHash: string | null;
  visualHashAlgorithm: string | null;
  visualHashVariants: string[];
  visualHashQuality: number | null;
  completeness: MasterCardCompletenessR438;
  confidence: number;
  missingFields: string[];
  sources: MasterCardSourceR438[];
  createdAt: string;
  updatedAt: string;
};

export type MasterCardCatalogInputR438 = Partial<Omit<MasterCardCatalogEntryR438,
  'schemaVersion' | 'catalogCardId' | 'completeness' | 'missingFields' | 'createdAt' | 'updatedAt'>> & {
  catalogCardId?: string;
  playerName: string;
  mainPosition: PositionCode;
  cardFingerprint?: string;
  playerFingerprint?: string;
  createdAt?: string;
  updatedAt?: string;
};

const LINE_ATTRIBUTE_KEYS: AttributeKey[] = [
  'offensiveAwareness','ballControl','dribbling','tightPossession','lowPass','loftedPass','finishing','heading','placeKicking','curl',
  'defensiveAwareness','defensiveEngagement','tackling','aggression','goalkeeperAwareness','goalkeeperCatching','goalkeeperParrying','goalkeeperReflexes','goalkeeperReach',
  'speed','acceleration','kickingPower','jump','physicalContact','balance','stamina'
];
const GK_ATTRIBUTE_KEYS: AttributeKey[] = ['goalkeeperAwareness','goalkeeperCatching','goalkeeperParrying','goalkeeperReflexes','goalkeeperReach'];
const VALID_POSITIONS = new Set<PositionCode>(['CF','SS','LWF','RWF','LMF','RMF','AMF','CMF','DMF','CB','LB','RB','GK']);

function normalizeText(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').trim();
}
function fnv1a(value: string) {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    output ^= value.charCodeAt(index);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(36);
}
function finite(value: unknown, min: number, max: number) {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : null;
}
function uniqueStrings(values: unknown) {
  return Array.from(new Set((Array.isArray(values) ? values : []).map((value) => String(value).trim()).filter(Boolean)));
}
function uniquePositions(values: unknown, main: PositionCode) {
  const parsed = (Array.isArray(values) ? values : []).filter((value): value is PositionCode => VALID_POSITIONS.has(value as PositionCode));
  return Array.from(new Set([main, ...parsed]));
}
function cleanAttributes(value: unknown): Partial<Record<AttributeKey, number>> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, raw]) => {
    if (!LINE_ATTRIBUTE_KEYS.includes(key as AttributeKey)) return [];
    const number = finite(raw, 1, 120);
    return number === null ? [] : [[key, Math.round(number)]];
  })) as Partial<Record<AttributeKey, number>>;
}
function cleanRatings(value: unknown): Partial<Record<PositionCode, number>> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, raw]) => {
    if (!VALID_POSITIONS.has(key as PositionCode)) return [];
    const number = finite(raw, 1, 120);
    return number === null ? [] : [[key, Math.round(number)]];
  })) as Partial<Record<PositionCode, number>>;
}
function cleanImpetos(value: unknown): MasterCardImpetoR438[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: MasterCardImpetoR438[] = [];
  for (const raw of value) {
    const item = typeof raw === 'string' ? { name: raw } : raw && typeof raw === 'object' ? raw as MasterCardImpetoR438 : null;
    const name = String(item?.name ?? '').trim();
    const key = normalizeText(name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push({ name, value: finite(item?.value, -99, 99), active: item?.active !== false });
  }
  return result;
}

export function masterCardTrainingPointsR438(card: Pick<MasterCardCatalogEntryR438, 'trainingPointsTotal' | 'level'>) {
  const explicit = finite(card.trainingPointsTotal, 20, 140);
  if (explicit !== null) return Math.round(explicit);
  return inferPointsFromCardLevel(card.level);
}

export function masterCardMissingFieldsR438(card: Pick<MasterCardCatalogEntryR438,
  'playerName' | 'mainPosition' | 'cardFingerprint' | 'sourceHash' | 'level' | 'trainingPointsTotal' | 'attributes' | 'positions' | 'nativeSkills' | 'additionalSkills' | 'specialSkills' | 'skillInventoryConfirmed'>) {
  const missing: string[] = [];
  const invalidName = !card.playerName.trim() || /^(novo jogador|jogador para revisar|jogador nao identificado)$/i.test(normalizeText(card.playerName));
  const identityStable = Boolean(card.cardFingerprint.startsWith('card-r126-') || String(card.sourceHash ?? '').trim());
  if (invalidName || !card.mainPosition || !identityStable) missing.push('identidade da edição');
  if (!Number.isFinite(Number(card.level)) || Number(card.level) < 1 || Number(card.level) > 99) missing.push('nível');
  else if (masterCardTrainingPointsR438(card as MasterCardCatalogEntryR438) === null) missing.push('PP');
  const keys = card.mainPosition === 'GK' ? GK_ATTRIBUTE_KEYS : LINE_ATTRIBUTE_KEYS;
  const attrCount = keys.filter((key) => Number.isFinite(Number(card.attributes[key]))).length;
  if (attrCount < keys.length) missing.push(card.mainPosition === 'GK' ? 'atributos de goleiro' : '26 atributos');
  if (!Array.isArray(card.positions) || !card.positions.includes(card.mainPosition)) missing.push('posições');
  const skillCount = card.nativeSkills.length + card.additionalSkills.length + card.specialSkills.length;
  if (!card.skillInventoryConfirmed && skillCount === 0) missing.push('inventário de habilidades');
  return missing;
}

export function masterCardCompletenessR438(card: Parameters<typeof masterCardMissingFieldsR438>[0]): MasterCardCompletenessR438 {
  const missing = masterCardMissingFieldsR438(card);
  if (!missing.length) return 'COMPLETE';
  const hasTechnical = Object.keys(card.attributes ?? {}).length > 0 || masterCardTrainingPointsR438(card as MasterCardCatalogEntryR438) !== null || card.nativeSkills.length + card.additionalSkills.length + card.specialSkills.length > 0;
  return hasTechnical ? 'PARTIAL' : 'IDENTITY_ONLY';
}

export function masterCardGenerationReadinessR452(card: MasterCardCatalogEntryR438) {
  const points = masterCardTrainingPointsR438(card);
  const validName = Boolean(card.playerName.trim()) && !/^(novo jogador|jogador para revisar|jogador nao identificado)$/i.test(normalizeText(card.playerName));
  const identityStable = Boolean(card.mainPosition && (card.cardFingerprint.startsWith('card-r126-') || String(card.sourceHash ?? '').trim() || card.catalogCardId));
  const canGenerate = validName && identityStable && points !== null;
  const provisional = canGenerate && card.completeness !== 'COMPLETE';
  return { canGenerate, provisional, points, missing: masterCardMissingFieldsR438(card) };
}

function provisionalCatalogId(input: MasterCardCatalogInputR438) {
  const canonical = String(input.cardFingerprint ?? '').trim();
  if (canonical.startsWith('card-r126-')) return `master-r438-${canonical}`;
  const source = [input.sourceHash, input.playerName, input.cardLabel, input.cardType, input.releaseDate, input.mainPosition, input.level].map(normalizeText).join('|');
  return `master-r438-provisional-${fnv1a(source)}`;
}

export function createMasterCardCatalogEntryR438(input: MasterCardCatalogInputR438): MasterCardCatalogEntryR438 {
  const now = new Date().toISOString();
  const mainPosition = VALID_POSITIONS.has(input.mainPosition) ? input.mainPosition : 'CF';
  const attributes = cleanAttributes(input.attributes);
  const cardFingerprint = String(input.cardFingerprint ?? '').trim() || `provisional-r438-${fnv1a(`${input.playerName}|${input.sourceHash ?? ''}|${input.cardLabel ?? ''}`)}`;
  const entry: MasterCardCatalogEntryR438 = {
    schemaVersion: 1,
    catalogCardId: String(input.catalogCardId ?? '').trim() || provisionalCatalogId({ ...input, cardFingerprint, mainPosition }),
    cardFingerprint,
    playerFingerprint: String(input.playerFingerprint ?? '').trim() || `player-r438-${fnv1a(normalizeText(input.playerName))}`,
    playerName: String(input.playerName ?? '').trim().slice(0, 100),
    cardLabel: String(input.cardLabel ?? '').trim().slice(0, 140),
    cardType: String(input.cardType ?? '').trim().slice(0, 80),
    specialTag: input.specialTag ? String(input.specialTag).trim().slice(0, 100) : null,
    country: input.country ? String(input.country).trim().slice(0, 80) : null,
    releaseDate: input.releaseDate ? String(input.releaseDate).trim().slice(0, 40) : null,
    mainPosition,
    positions: uniquePositions(input.positions, mainPosition),
    positionRatings: cleanRatings(input.positionRatings),
    playstyle: input.playstyle ? String(input.playstyle).trim().slice(0, 100) : null,
    offensivePlaystyle: input.offensivePlaystyle ? String(input.offensivePlaystyle).trim().slice(0, 100) : null,
    defensivePlaystyle: input.defensivePlaystyle ? String(input.defensivePlaystyle).trim().slice(0, 100) : null,
    defensivePlaystyleConfirmed: Boolean(input.defensivePlaystyleConfirmed),
    overall: finite(input.overall, 1, 120),
    level: finite(input.level, 1, 99),
    trainingPointsTotal: finite(input.trainingPointsTotal, 20, 140),
    attributes,
    nativeSkills: uniqueStrings(input.nativeSkills),
    additionalSkills: uniqueStrings(input.additionalSkills),
    specialSkills: uniqueStrings(input.specialSkills),
    unclassifiedSkills: uniqueStrings(input.unclassifiedSkills),
    skillInventoryConfirmed: Boolean(input.skillInventoryConfirmed),
    impetos: cleanImpetos(input.impetos),
    boosters: uniqueStrings(input.boosters),
    height: finite(input.height, 120, 240),
    weight: finite(input.weight, 30, 200),
    age: finite(input.age, 14, 80),
    condition: input.condition && typeof input.condition === 'object' ? { ...input.condition } : {},
    physicalProfile: input.physicalProfile && typeof input.physicalProfile === 'object' ? { ...input.physicalProfile } : {},
    imageRef: input.imageRef ? String(input.imageRef).trim() : null,
    portraitRef: input.portraitRef ? String(input.portraitRef).trim() : null,
    sourceHash: input.sourceHash ? String(input.sourceHash).trim() : null,
    visualHash: /^[0-9a-f]{16}$/i.test(String(input.visualHash ?? '').trim()) ? String(input.visualHash).trim().toLowerCase() : null,
    visualHashAlgorithm: input.visualHashAlgorithm ? String(input.visualHashAlgorithm).trim().slice(0, 40) : null,
    visualHashVariants: uniqueStrings(input.visualHashVariants).filter((value) => /^[0-9a-f]{16}$/i.test(value)).map((value) => value.toLowerCase()).slice(0, 12),
    visualHashQuality: finite(input.visualHashQuality, 0, 100),
    completeness: 'IDENTITY_ONLY',
    confidence: Math.max(0, Math.min(100, Math.round(Number(input.confidence) || 0))),
    missingFields: [],
    sources: Array.from(new Set((input.sources ?? []).filter((source): source is MasterCardSourceR438 => ['MIGRATED_SQUAD_MAPPING','OCR_IMPORT','MANUAL','CATALOG_PATCH'].includes(source)))),
    createdAt: String(input.createdAt || now),
    updatedAt: String(input.updatedAt || now)
  };
  const points = masterCardTrainingPointsR438(entry);
  if (entry.trainingPointsTotal === null && points !== null) entry.trainingPointsTotal = points;
  entry.missingFields = masterCardMissingFieldsR438(entry);
  entry.completeness = masterCardCompletenessR438(entry);
  return entry;
}

export function sameMasterCardEditionR438(left: MasterCardCatalogEntryR438, right: MasterCardCatalogEntryR438) {
  if (left.catalogCardId && left.catalogCardId === right.catalogCardId) return true;
  if (left.cardFingerprint.startsWith('card-r126-') && left.cardFingerprint === right.cardFingerprint) return true;
  if (left.sourceHash && right.sourceHash && normalizeText(left.sourceHash) === normalizeText(right.sourceHash)) return true;
  return false;
}

export function mergeMasterCardCatalogEntryR438(left: MasterCardCatalogEntryR438, right: MasterCardCatalogEntryR438) {
  if (!sameMasterCardEditionR438(left, right)) throw new Error('R438: tentativa de mesclar edições diferentes.');
  const merged = createMasterCardCatalogEntryR438({
    ...left,
    ...right,
    catalogCardId: left.catalogCardId,
    cardFingerprint: left.cardFingerprint.startsWith('card-r126-') ? left.cardFingerprint : right.cardFingerprint,
    playerFingerprint: left.playerFingerprint || right.playerFingerprint,
    positions: Array.from(new Set([...left.positions, ...right.positions])),
    positionRatings: { ...left.positionRatings, ...right.positionRatings },
    attributes: { ...left.attributes, ...right.attributes },
    nativeSkills: Array.from(new Set([...left.nativeSkills, ...right.nativeSkills])),
    additionalSkills: Array.from(new Set([...left.additionalSkills, ...right.additionalSkills])),
    specialSkills: Array.from(new Set([...left.specialSkills, ...right.specialSkills])),
    unclassifiedSkills: Array.from(new Set([...left.unclassifiedSkills, ...right.unclassifiedSkills])),
    impetos: [...left.impetos, ...right.impetos],
    boosters: Array.from(new Set([...left.boosters, ...right.boosters])),
    sources: Array.from(new Set([...left.sources, ...right.sources])),
    createdAt: left.createdAt,
    updatedAt: new Date().toISOString(),
    skillInventoryConfirmed: left.skillInventoryConfirmed || right.skillInventoryConfirmed,
    imageRef: right.imageRef || left.imageRef,
    portraitRef: right.portraitRef || left.portraitRef,
    sourceHash: right.sourceHash || left.sourceHash,
    visualHash: right.visualHash || left.visualHash,
    visualHashAlgorithm: right.visualHashAlgorithm || left.visualHashAlgorithm,
    visualHashVariants: Array.from(new Set([...(left.visualHashVariants ?? []), ...(right.visualHashVariants ?? []), ...(left.visualHash ? [left.visualHash] : []), ...(right.visualHash ? [right.visualHash] : [])])).filter((value) => value !== (right.visualHash || left.visualHash)).slice(0, 12),
    visualHashQuality: Math.max(Number(left.visualHashQuality) || 0, Number(right.visualHashQuality) || 0) || null,
    confidence: Math.max(left.confidence, right.confidence)
  });
  return merged;
}
