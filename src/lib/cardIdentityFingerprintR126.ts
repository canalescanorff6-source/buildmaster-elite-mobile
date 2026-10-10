import type { ParsedCard, PositionCode } from './analyzerDomain';
import { TRAINING_KEYS } from './trainingPlanCore';

export const CARD_IDENTITY_FINGERPRINT_R126_VERSION = '40.80-r126-card-identity-v2' as const;
export const CARD_EVIDENCE_FINGERPRINT_R126_VERSION = '40.80-r126-card-evidence-v2' as const;

function normalizeText(value: unknown) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function fnv1a(value: string) {
  let output = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    output ^= value.charCodeAt(index);
    output = Math.imul(output, 16777619);
  }
  return (output >>> 0).toString(36);
}

function sortedRecord(record: Record<string, unknown> | null | undefined) {
  return Object.entries(record ?? {})
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right, 'en'))
    .map(([key, value]) => `${key}:${normalizeText(value)}`)
    .join(',');
}

function normalizedList(values: Array<unknown> | null | undefined) {
  return (values ?? [])
    .map(normalizeText)
    .filter(Boolean)
    .sort((left, right) => left.localeCompare(right, 'pt-BR'))
    .join(',');
}

function trainingSignature(parsed: ParsedCard) {
  return TRAINING_KEYS.map((key) => `${key}:${Number(parsed.autoTrainingPlan?.[key] ?? 0)}`).join(',');
}

export function legacyStructuralCardIdentityFingerprintR126(parsed: ParsedCard) {
  const positions = [...new Set<PositionCode>([parsed.mainPosition, ...(parsed.positions ?? [])])]
    .sort((left, right) => left.localeCompare(right, 'en'))
    .join(',');
  const immutableSkills = normalizedList([
    ...(parsed.nativeSkills ?? []),
    ...(parsed.specialSkills ?? [])
  ]);

  const source = [
    CARD_IDENTITY_FINGERPRINT_R126_VERSION,
    normalizeText(parsed.playerName),
    normalizeText(parsed.cardType),
    normalizeText(parsed.specialTag),
    normalizeText(parsed.country),
    parsed.mainPosition,
    positions,
    normalizeText(parsed.offensivePlaystyle ?? parsed.playstyle),
    normalizeText(parsed.defensivePlaystyle),
    normalizeText(parsed.dominantFoot),
    parsed.level ?? '',
    parsed.height ?? '',
    parsed.weight ?? '',
    parsed.age ?? '',
    immutableSkills
  ].join('|');

  return `card-r126-${fnv1a(source)}`;
}

export function cardIdentityFingerprintR126(parsed: ParsedCard) {
  const edition = parsed.editionIdentity;
  const official = normalizeText(edition?.officialCardId);
  if (edition?.officialCardIdVerified === true && official) {
    return `card-r126-official-${fnv1a(`${CARD_IDENTITY_FINGERPRINT_R126_VERSION}|official|${official}`)}`;
  }
  const catalog = normalizeText(edition?.catalogCardId);
  if (catalog) {
    return `card-r126-catalog-${fnv1a(`${CARD_IDENTITY_FINGERPRINT_R126_VERSION}|catalog|${catalog}`)}`;
  }
  return legacyStructuralCardIdentityFingerprintR126(parsed);
}

export function cardIdentityAliasesR457(parsed: ParsedCard) {
  return [...new Set([cardIdentityFingerprintR126(parsed), legacyStructuralCardIdentityFingerprintR126(parsed)])];
}

export function cardEvidenceFingerprintR126(parsed: ParsedCard) {
  const impetos = (parsed.impetos ?? [])
    .map((item) => `${normalizeText(item.name)}:${item.value ?? ''}:${item.active === false ? 0 : 1}`)
    .sort((left, right) => left.localeCompare(right, 'pt-BR'))
    .join(',');
  const source = [
    CARD_EVIDENCE_FINGERPRINT_R126_VERSION,
    cardIdentityFingerprintR126(parsed),
    sortedRecord(parsed.attributes as Record<string, unknown>),
    sortedRecord(parsed.positionRatings as Record<string, unknown>),
    normalizedList(parsed.additionalSkills ?? []),
    parsed.editionIdentity?.officialCardIdVerified ? 1 : 0,
    parsed.trainingBase?.cardId ?? '',
    sortedRecord(parsed.trainingBase?.attributes),
    sortedRecord(parsed.trainingBase?.fixedBonus),
    normalizedList(parsed.trainingBase?.sources),
    impetos,
    parsed.trainingPointsTotal ?? '',
    parsed.trainingPointsUsed ?? '',
    parsed.trainingPointSource ?? '',
    parsed.autoTrainingPoints ?? '',
    trainingSignature(parsed),
    parsed.manualConfirmed ? 1 : 0,
    parsed.evidence?.attributeCount ?? '',
    parsed.evidence?.positionRatingsCount ?? ''
  ].join('|');
  return `evidence-r126-${fnv1a(source)}`;
}


export function playerIdentityKeyFromNameR126(playerName: unknown, fallbackCardIdentity = '') {
  const name = normalizeText(playerName);
  if (name && name !== 'jogador nao identificado' && name !== 'novo jogador' && name !== 'jogador para revisar') {
    return `player-r126-${fnv1a(`${CARD_IDENTITY_FINGERPRINT_R126_VERSION}|${name}`)}`;
  }
  const fallback = normalizeText(fallbackCardIdentity) || 'unresolved';
  return `player-r126-unknown-${fnv1a(`${CARD_IDENTITY_FINGERPRINT_R126_VERSION}|${fallback}`)}`;
}

export function playerIdentityFingerprintR126(parsed: ParsedCard) {
  return playerIdentityKeyFromNameR126(parsed.playerName, cardIdentityFingerprintR126(parsed));
}

export function cardUsageIdentityKeyR126(parsed: ParsedCard, usagePosition: PositionCode | string, usageFunction = '') {
  const normalizedFunction=normalizeText(usageFunction).replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  return `${cardIdentityFingerprintR126(parsed)}::usage:${String(usagePosition || parsed.mainPosition).toUpperCase()}::function:${normalizedFunction || 'default'}`;
}

export function sameIntrinsicCardR126(left: ParsedCard, right: ParsedCard) {
  return cardIdentityFingerprintR126(left) === cardIdentityFingerprintR126(right);
}
