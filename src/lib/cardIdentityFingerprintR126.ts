import type { ParsedCard, PositionCode } from './analyzerDomain';
import { TRAINING_KEYS } from './trainingPlanCore';

export const CARD_IDENTITY_FINGERPRINT_R126_VERSION = '40.80-r126-card-identity-v2' as const;
export const CARD_EVIDENCE_FINGERPRINT_R126_VERSION = '40.80-r126-card-evidence-v1' as const;

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

/**
 * Identidade ESTÁVEL da edição da carta.
 *
 * Nunca inclui estado que o usuário pode alterar ou que é derivado da ficha:
 * GER/Overall, atributos já treinados, position ratings treináveis, progressão,
 * posição escolhida para uso, habilidades adicionais, Ímpeto, técnico ou formação.
 *
 * A edição é distinguida pela evidência estrutural mais estável disponível no print:
 * jogador + tipo/tag + posição/estilos registrados + dados físicos + nível máximo
 * + inventário nativo/especial. O `internalId` legado fica fora porque embute GER.
 */
export function cardIdentityFingerprintR126(parsed: ParsedCard) {
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

/**
 * Impressão do ESTADO LIDO da mesma carta.
 * Serve para cache/invalidação e não para decidir se é outra edição.
 * Inclui números e recursos mutáveis que podem alterar a análise final,
 * mas continua excluindo GER para impedir qualquer dependência indireta dele.
 */
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


/**
 * Identidade do atleta, acima da edição da carta.
 * É usada apenas onde o jogo exige uma pessoa única no elenco/escalação.
 * Não inclui tipo de carta, idade histórica, GER ou progressão: duas cartas do
 * mesmo jogador continuam sendo o mesmo atleta para fins de escalação.
 */
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

export function cardUsageIdentityKeyR126(parsed: ParsedCard, usagePosition: PositionCode | string) {
  return `${cardIdentityFingerprintR126(parsed)}::usage:${String(usagePosition || parsed.mainPosition).toUpperCase()}`;
}

export function sameIntrinsicCardR126(left: ParsedCard, right: ParsedCard) {
  return cardIdentityFingerprintR126(left) === cardIdentityFingerprintR126(right);
}
