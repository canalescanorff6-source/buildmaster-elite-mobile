import type { PositionCode } from '@/lib/analyzerDomain';
import type { MasterCardCatalogEntryR438 } from './masterCardCatalogR438';

export const CARD_IDENTITY_RESOLVER_R439_VERSION = '40.80-r439-intelligent-card-resolver-v1' as const;

export type MasterCardIdentityObservationR439 = {
  sourceHash?: string | null;
  cardFingerprint?: string | null;
  playerName?: string | null;
  mainPosition?: PositionCode | null;
  releaseDate?: string | null;
  cardType?: string | null;
  cardLabel?: string | null;
  playstyle?: string | null;
  overall?: number | null;
  level?: number | null;
  country?: string | null;
  visualFingerprint?: { algorithm: 'dhash64-v1'; hash: string; variants?: string[]; quality: number } | null;
  rawText?: string | null;
};

export type MasterCardResolutionStatusR439 = 'RESOLVED' | 'AMBIGUOUS' | 'NEW_CARD' | 'NEEDS_REVIEW';
export type MasterCardResolutionActionR439 = 'USE_CATALOG' | 'FULL_OCR' | 'CHOOSE_CANDIDATE' | 'REVIEW_IDENTITY';
export type MasterCardResolutionReasonR439 = 'SOURCE_HASH_EXACT' | 'CARD_FINGERPRINT_EXACT' | 'IDENTITY_SCORE' | 'MULTIPLE_CANDIDATES' | 'PLAYER_NOT_FOUND' | 'IDENTITY_INSUFFICIENT' | 'VISUAL_FINGERPRINT_MATCH' | 'VISUAL_FINGERPRINT_AMBIGUOUS';

export type MasterCardResolutionCandidateR439 = {
  catalogCardId: string;
  score: number;
  reasons: string[];
  completeness: MasterCardCatalogEntryR438['completeness'];
};

export type MasterCardResolutionR439 = {
  status: MasterCardResolutionStatusR439;
  action: MasterCardResolutionActionR439;
  reason: MasterCardResolutionReasonR439;
  selectedCatalogCardId: string | null;
  confidence: number;
  candidates: MasterCardResolutionCandidateR439[];
};

function normalize(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizedHash(value: unknown) {
  return String(value ?? '').trim().toLowerCase();
}

function tokenSimilarity(left: unknown, right: unknown) {
  const a = new Set(normalize(left).split(' ').filter(Boolean));
  const b = new Set(normalize(right).split(' ').filter(Boolean));
  if (!a.size || !b.size) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / new Set([...a, ...b]).size;
}

function sameText(left: unknown, right: unknown) {
  const a = normalize(left);
  const b = normalize(right);
  return Boolean(a && b && a === b);
}

function scoreCandidate(observation: MasterCardIdentityObservationR439, card: MasterCardCatalogEntryR438) {
  let score = 0;
  const reasons: string[] = [];
  const observedName = normalize(observation.playerName);
  const cardName = normalize(card.playerName);
  if (observedName && cardName) {
    if (observedName === cardName) { score += 45; reasons.push('nome exato'); }
    else if (cardName.includes(observedName) || observedName.includes(cardName)) { score += 30; reasons.push('nome compatível'); }
  }
  if (observation.mainPosition) {
    if (observation.mainPosition === card.mainPosition) { score += 15; reasons.push('posição principal'); }
    else if (card.positions.includes(observation.mainPosition)) { score += 8; reasons.push('posição compatível'); }
    else score -= 15;
  }
  if (observation.releaseDate && card.releaseDate && sameText(observation.releaseDate, card.releaseDate)) { score += 20; reasons.push('data da edição'); }
  if (observation.cardType && card.cardType && sameText(observation.cardType, card.cardType)) { score += 12; reasons.push('tipo da carta'); }
  if (observation.playstyle && (sameText(observation.playstyle, card.offensivePlaystyle) || sameText(observation.playstyle, card.playstyle))) { score += 10; reasons.push('estilo'); }
  if (Number.isFinite(Number(observation.overall)) && Number.isFinite(Number(card.overall))) {
    const delta = Math.abs(Number(observation.overall) - Number(card.overall));
    if (delta === 0) { score += 6; reasons.push('overall'); }
    else if (delta === 1) score += 3;
  }
  if (Number.isFinite(Number(observation.level)) && Number.isFinite(Number(card.level))) {
    if (Number(observation.level) === Number(card.level)) { score += 6; reasons.push('nível'); }
  }
  if (observation.country && card.country && sameText(observation.country, card.country)) { score += 4; reasons.push('país'); }
  const labelSimilarity = tokenSimilarity(observation.cardLabel, card.cardLabel);
  if (labelSimilarity >= .25) { score += Math.round(labelSimilarity * 12); reasons.push('rótulo da edição'); }
  return { score: Math.max(0, Math.min(100, Math.round(score))), reasons };
}

function resolved(card: MasterCardCatalogEntryR438, reason: MasterCardResolutionReasonR439, confidence = 100): MasterCardResolutionR439 {
  return {
    status: 'RESOLVED',
    action: card.completeness === 'COMPLETE' ? 'USE_CATALOG' : 'FULL_OCR',
    reason,
    selectedCatalogCardId: card.catalogCardId,
    confidence,
    candidates: [{ catalogCardId: card.catalogCardId, score: confidence, reasons: [reason], completeness: card.completeness }]
  };
}

export function resolveMasterCardObservationR439(observation: MasterCardIdentityObservationR439, catalog: MasterCardCatalogEntryR438[]): MasterCardResolutionR439 {
  const hash = normalizedHash(observation.sourceHash);
  if (hash) {
    const exact = catalog.find((card) => normalizedHash(card.sourceHash) === hash);
    if (exact) return resolved(exact, 'SOURCE_HASH_EXACT');
  }
  const fingerprint = String(observation.cardFingerprint ?? '').trim();
  if (fingerprint.startsWith('card-r126-')) {
    const exact = catalog.find((card) => card.cardFingerprint === fingerprint);
    if (exact) return resolved(exact, 'CARD_FINGERPRINT_EXACT');
  }
  const observedName = normalize(observation.playerName);
  if (!observedName) return { status: 'NEEDS_REVIEW', action: 'REVIEW_IDENTITY', reason: 'IDENTITY_INSUFFICIENT', selectedCatalogCardId: null, confidence: 0, candidates: [] };
  const samePlayer = catalog.filter((card) => {
    const cardName = normalize(card.playerName);
    return cardName === observedName || cardName.includes(observedName) || observedName.includes(cardName);
  });
  if (!samePlayer.length) return { status: 'NEW_CARD', action: 'FULL_OCR', reason: 'PLAYER_NOT_FOUND', selectedCatalogCardId: null, confidence: 0, candidates: [] };
  const candidates = samePlayer
    .map((card) => ({ card, ...scoreCandidate(observation, card) }))
    .sort((a, b) => b.score - a.score || a.card.catalogCardId.localeCompare(b.card.catalogCardId));
  const top = candidates[0];
  const second = candidates[1];
  const margin = top.score - (second?.score ?? 0);
  const exposed = candidates.slice(0, 5).map(({ card, score, reasons }) => ({ catalogCardId: card.catalogCardId, score, reasons, completeness: card.completeness }));
  if ((top.score >= 85 && margin >= 10) || (!second && top.score >= 65)) {
    return {
      status: 'RESOLVED',
      action: top.card.completeness === 'COMPLETE' ? 'USE_CATALOG' : 'FULL_OCR',
      reason: 'IDENTITY_SCORE',
      selectedCatalogCardId: top.card.catalogCardId,
      confidence: top.score,
      candidates: exposed
    };
  }
  if (candidates.length > 1 && top.score >= 50) {
    return { status: 'AMBIGUOUS', action: 'CHOOSE_CANDIDATE', reason: 'MULTIPLE_CANDIDATES', selectedCatalogCardId: null, confidence: top.score, candidates: exposed };
  }
  return { status: 'NEEDS_REVIEW', action: 'REVIEW_IDENTITY', reason: 'IDENTITY_INSUFFICIENT', selectedCatalogCardId: null, confidence: top.score, candidates: exposed };
}

const MONTHS: Record<string, string> = { jan: '01', feb: '02', fev: '02', mar: '03', apr: '04', abr: '04', may: '05', mai: '05', jun: '06', jul: '07', aug: '08', ago: '08', sep: '09', set: '09', oct: '10', out: '10', nov: '11', dec: '12', dez: '12' };
const CARD_TYPES = ['Show Time', 'Big Time', 'Epic', 'Highlight', 'Trending', 'Featured', 'POTW', 'Standard'];
const COUNTRIES = ['Portugal', 'Brazil', 'Brasil', 'Argentina', 'France', 'França', 'Spain', 'Espanha', 'England', 'Inglaterra', 'Germany', 'Alemanha', 'Italy', 'Itália', 'Netherlands', 'Holanda'];

export function parseQuickIdentityHintsR439(text: string) {
  const source = String(text ?? '');
  const normalized = normalize(source);
  let releaseDate: string | null = null;
  const date = source.match(/\b(\d{1,2})\s+([A-Za-zÀ-ÿ]{3,})\s+'?(\d{2,4})\b/i);
  if (date) {
    const month = MONTHS[normalize(date[2]).slice(0, 3)];
    const yearRaw = Number(date[3]);
    const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
    if (month && year >= 2000 && year <= 2100) releaseDate = `${year}-${month}-${String(Number(date[1])).padStart(2, '0')}`;
  }
  if (!releaseDate) {
    const numeric = source.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/);
    if (numeric) {
      const yearRaw = Number(numeric[3]);
      const year = yearRaw < 100 ? 2000 + yearRaw : yearRaw;
      releaseDate = `${year}-${String(Number(numeric[2])).padStart(2, '0')}-${String(Number(numeric[1])).padStart(2, '0')}`;
    }
  }
  const cardType = CARD_TYPES.find((type) => normalized.includes(normalize(type))) ?? null;
  const overallMatch = source.match(/(?:overall|ger|ovr)\s*[:=.-]?\s*(\d{2,3})/i);
  const levelMatch = source.match(/(?:level|nivel|nível|lvl|lv)\s*(?:max(?:imo|ímo)?)?\s*[:=.-]?\s*(\d{1,2})/i);
  const country = COUNTRIES.find((value) => normalized.includes(normalize(value))) ?? null;
  return {
    releaseDate,
    cardType,
    overall: overallMatch ? Number(overallMatch[1]) : null,
    level: levelMatch ? Number(levelMatch[1]) : null,
    country: country === 'Brasil' ? 'Brazil' : country === 'França' ? 'France' : country === 'Espanha' ? 'Spain' : country === 'Inglaterra' ? 'England' : country === 'Alemanha' ? 'Germany' : country === 'Itália' ? 'Italy' : country === 'Holanda' ? 'Netherlands' : country
  };
}
