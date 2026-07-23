import type { AnalysisResult, PositionCode, TrainingKey, TrainingPlan } from './analyzerDomain';
import { readAccountStorage, writeAccountStorage } from './accountStorage';
import { createStableId } from './stableId';

export const CREATOR_BUILD_RESEARCH_STORAGE_KEY = 'buildmaster_creator_build_research_v27_37';
export const CREATOR_BUILD_RESEARCH_LIMIT = 500;
export const CREATOR_BUILD_RESEARCH_EVENT = 'buildmaster:creator-build-research-updated';

export const CREATOR_TRAINING_KEYS: readonly TrainingKey[] = [
  'shooting',
  'passing',
  'dribbling',
  'dexterity',
  'lowerBodyStrength',
  'aerialStrength',
  'defending',
  'gk1',
  'gk2',
  'gk3'
];

export const CREATOR_TRAINING_LABELS: Record<TrainingKey, string> = {
  shooting: 'Finalização',
  passing: 'Passe',
  dribbling: 'Drible',
  dexterity: 'Destreza',
  lowerBodyStrength: 'Força das pernas',
  aerialStrength: 'Força em bola aérea',
  defending: 'Defesa',
  gk1: 'Goleiro 1',
  gk2: 'Goleiro 2',
  gk3: 'Goleiro 3'
};

export type CreatorPlatform = 'YOUTUBE' | 'TIKTOK' | 'OUTRA';
export type CreatorAuthority = 'PRO_PLAYER' | 'TOP_RANK' | 'CRIADOR' | 'COMUNIDADE';
export type CreatorDevice = 'MOBILE' | 'CONSOLE' | 'AMBOS' | 'NAO_INFORMADO';

export type CreatorCardIdentity = {
  playerName: string;
  cardType: string;
  specialTag: string;
  mainPosition: PositionCode;
  maxOverall: number | null;
  trainingPointsTotal: number | null;
};

export type CreatorBuildSource = {
  id: string;
  platform: CreatorPlatform;
  authority: CreatorAuthority;
  device: CreatorDevice;
  url: string;
  title: string;
  channel: string;
  country: string;
  publishedAt: string | null;
  reviewedAt: string;
  testedInMatches: boolean;
  targetPosition: PositionCode;
  playstyle: string;
  card: CreatorCardIdentity;
  training: TrainingPlan;
  notes: string;
};

export type CreatorSourceMatch = {
  source: CreatorBuildSource;
  score: number;
  exactCard: boolean;
  reasons: string[];
  warnings: string[];
  weight: number;
};

export type CreatorBlockConsensus = {
  key: TrainingKey;
  label: string;
  value: number;
  min: number;
  max: number;
  agreement: number;
  sampleCount: number;
};

export type CreatorBuildConsensus = {
  sources: CreatorSourceMatch[];
  acceptedSources: CreatorSourceMatch[];
  rejectedSources: CreatorSourceMatch[];
  training: TrainingPlan;
  blocks: CreatorBlockConsensus[];
  costByBlock: TrainingPlan;
  totalCost: number;
  sourceCount: number;
  exactCardCount: number;
  proSourceCount: number;
  confidence: number;
  confidenceLabel: 'muito alta' | 'alta' | 'média' | 'baixa' | 'insuficiente';
  verdict: string;
  warnings: string[];
};

const EMPTY_TRAINING: TrainingPlan = {
  shooting: 0,
  passing: 0,
  dribbling: 0,
  dexterity: 0,
  lowerBodyStrength: 0,
  aerialStrength: 0,
  defending: 0,
  gk1: 0,
  gk2: 0,
  gk3: 0
};

function normalizeText(value: unknown, limit = 180): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, limit);
}

function fold(value: unknown): string {
  return normalizeText(value, 240)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function safeDate(value: unknown): string | null {
  const text = normalizeText(value, 40);
  if (!text || Number.isNaN(Date.parse(text))) return null;
  return new Date(text).toISOString().slice(0, 10);
}

function safePosition(value: unknown, fallback: PositionCode): PositionCode {
  const allowed: PositionCode[] = ['CF', 'SS', 'LWF', 'RWF', 'LMF', 'RMF', 'AMF', 'CMF', 'DMF', 'CB', 'LB', 'RB', 'GK'];
  return allowed.includes(value as PositionCode) ? value as PositionCode : fallback;
}

function safeTraining(value: unknown): TrainingPlan {
  const record = value && typeof value === 'object' ? value as Partial<Record<TrainingKey, unknown>> : {};
  const plan = { ...EMPTY_TRAINING };
  for (const key of CREATOR_TRAINING_KEYS) {
    const number = Number(record[key] ?? 0);
    plan[key] = Number.isFinite(number) ? Math.max(0, Math.min(16, Math.round(number))) : 0;
  }
  return plan;
}

function safeUrl(value: unknown): string {
  const text = normalizeText(value, 1000);
  if (!text) return '';
  try {
    const parsed = new URL(text);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
    return parsed.toString().slice(0, 1000);
  } catch {
    return '';
  }
}

export function detectCreatorPlatform(url: string): CreatorPlatform {
  try {
    const host = new URL(url).hostname.toLocaleLowerCase('en-US').replace(/^www\./, '');
    if (host === 'youtu.be' || host.endsWith('youtube.com')) return 'YOUTUBE';
    if (host === 'tiktok.com' || host.endsWith('.tiktok.com')) return 'TIKTOK';
  } catch {
    return 'OUTRA';
  }
  return 'OUTRA';
}

export function emptyCreatorTraining(): TrainingPlan {
  return { ...EMPTY_TRAINING };
}

export function trainingLevelCost(level: number): number {
  if (level <= 0) return 0;
  return Math.ceil(level / 4);
}

export function trainingTotalCost(level: number): number {
  let cost = 0;
  for (let current = 1; current <= Math.max(0, Math.round(level)); current += 1) cost += trainingLevelCost(current);
  return cost;
}

export function creatorTrainingCost(plan: TrainingPlan): { costByBlock: TrainingPlan; totalCost: number } {
  const costByBlock = { ...EMPTY_TRAINING };
  for (const key of CREATOR_TRAINING_KEYS) costByBlock[key] = trainingTotalCost(plan[key]);
  return { costByBlock, totalCost: Object.values(costByBlock).reduce((sum, value) => sum + value, 0) };
}

const CREATOR_TRAINING_ALIASES: Record<TrainingKey, string[]> = {
  shooting: ['finalizacao', 'finalização', 'chute', 'shooting'],
  passing: ['passe', 'passing'],
  dribbling: ['drible', 'dribbling'],
  dexterity: ['destreza', 'dexterity'],
  lowerBodyStrength: ['forca das pernas', 'força das pernas', 'forca de pernas', 'força de pernas', 'lower body strength'],
  aerialStrength: ['forca em bola aerea', 'força em bola aérea', 'bola aerea', 'bola aérea', 'aerial strength'],
  defending: ['defesa', 'defendendo', 'defending'],
  gk1: ['goleiro 1', 'gk 1', 'gk1', 'go 1'],
  gk2: ['goleiro 2', 'gk 2', 'gk2', 'go 2'],
  gk3: ['goleiro 3', 'gk 3', 'gk3', 'go 3']
};

export type ParsedCreatorTraining = {
  training: TrainingPlan;
  matchedKeys: TrainingKey[];
  confidence: number;
  method: 'labels' | 'sequence' | 'mixed' | 'none';
  evidence: string[];
};

function escapedPattern(value: string): string {
  return fold(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
}

export function parseCreatorTrainingText(value: string): ParsedCreatorTraining {
  const normalized = fold(value);
  const training = { ...EMPTY_TRAINING };
  const matched = new Set<TrainingKey>();
  const evidence: string[] = [];

  for (const key of CREATOR_TRAINING_KEYS) {
    for (const alias of CREATOR_TRAINING_ALIASES[key]) {
      const pattern = escapedPattern(alias);
      const match = normalized.match(new RegExp(`(?:^|\\s)${pattern}(?:\\s|[:=+\\-])*?(1[0-6]|[0-9])(?:\\s|$)`));
      if (!match) continue;
      training[key] = Number(match[1]);
      matched.add(key);
      evidence.push(`${CREATOR_TRAINING_LABELS[key]} ${match[1]}`);
      break;
    }
  }

  const sequence = [...String(value).matchAll(/\+\s*(1[0-6]|[0-9])(?!\d)/g)].map((match) => Number(match[1]));
  const sequenceLength = sequence.length >= 10 ? 10 : sequence.length >= 7 ? 7 : 0;
  if (sequenceLength) {
    CREATOR_TRAINING_KEYS.slice(0, sequenceLength).forEach((key, index) => {
      if (matched.has(key)) return;
      training[key] = sequence[index] ?? 0;
      matched.add(key);
      evidence.push(`${CREATOR_TRAINING_LABELS[key]} ${sequence[index] ?? 0} (sequência)`);
    });
  }

  const matchedKeys = CREATOR_TRAINING_KEYS.filter((key) => matched.has(key));
  const usedLabels = evidence.some((item) => !item.endsWith('(sequência)'));
  const usedSequence = evidence.some((item) => item.endsWith('(sequência)'));
  const method: ParsedCreatorTraining['method'] = !matchedKeys.length ? 'none' : usedLabels && usedSequence ? 'mixed' : usedLabels ? 'labels' : 'sequence';
  const expected = matchedKeys.some((key) => key.startsWith('gk')) ? 10 : 7;
  const coverage = Math.min(1, matchedKeys.length / expected);
  const confidence = Math.round(coverage * (method === 'labels' ? 100 : method === 'mixed' ? 90 : method === 'sequence' ? 82 : 0));
  return { training, matchedKeys, confidence, method, evidence };
}

export function cardIdentityFromResult(result: AnalysisResult): CreatorCardIdentity {
  return {
    playerName: normalizeText(result.parsed.playerName, 100),
    cardType: normalizeText(result.parsed.cardType, 100),
    specialTag: normalizeText(result.parsed.specialTag, 100),
    mainPosition: result.parsed.mainPosition,
    maxOverall: Number.isFinite(Number(result.parsed.maxOverall)) ? Number(result.parsed.maxOverall) : null,
    trainingPointsTotal: Number.isFinite(Number(result.trainingPointsTotal)) ? Number(result.trainingPointsTotal) : null
  };
}

export function creatorSearchQuery(result: AnalysisResult): string {
  const identity = cardIdentityFromResult(result);
  return [
    'eFootball 2026',
    identity.playerName,
    identity.cardType,
    identity.specialTag,
    identity.maxOverall ? `overall ${identity.maxOverall}` : '',
    'best progression build'
  ].filter(Boolean).join(' ');
}

export function creatorSearchUrls(result: AnalysisResult): { youtube: string; tiktok: string } {
  const query = encodeURIComponent(creatorSearchQuery(result));
  return {
    youtube: `https://www.youtube.com/results?search_query=${query}`,
    tiktok: `https://www.tiktok.com/search?q=${query}`
  };
}

function sanitizeCard(value: unknown, fallback: CreatorCardIdentity): CreatorCardIdentity {
  const record = value && typeof value === 'object' ? value as Partial<CreatorCardIdentity> : {};
  const maxOverall = Number(record.maxOverall);
  const trainingPointsTotal = Number(record.trainingPointsTotal);
  return {
    playerName: normalizeText(record.playerName || fallback.playerName, 100),
    cardType: normalizeText(record.cardType || fallback.cardType, 100),
    specialTag: normalizeText(record.specialTag || fallback.specialTag, 100),
    mainPosition: safePosition(record.mainPosition, fallback.mainPosition),
    maxOverall: Number.isFinite(maxOverall) && maxOverall > 0 ? Math.round(maxOverall) : null,
    trainingPointsTotal: Number.isFinite(trainingPointsTotal) && trainingPointsTotal > 0 ? Math.round(trainingPointsTotal) : null
  };
}

export function sanitizeCreatorSource(value: unknown, fallbackCard?: CreatorCardIdentity): CreatorBuildSource | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Partial<CreatorBuildSource>;
  const fallback: CreatorCardIdentity = fallbackCard ?? {
    playerName: '', cardType: '', specialTag: '', mainPosition: 'CF', maxOverall: null, trainingPointsTotal: null
  };
  const url = safeUrl(record.url);
  const card = sanitizeCard(record.card, fallback);
  if (!url || !card.playerName) return null;
  const platform = ['YOUTUBE', 'TIKTOK', 'OUTRA'].includes(String(record.platform))
    ? record.platform as CreatorPlatform
    : detectCreatorPlatform(url);
  const authority: CreatorAuthority = ['PRO_PLAYER', 'TOP_RANK', 'CRIADOR', 'COMUNIDADE'].includes(String(record.authority))
    ? record.authority as CreatorAuthority
    : 'CRIADOR';
  const device: CreatorDevice = ['MOBILE', 'CONSOLE', 'AMBOS', 'NAO_INFORMADO'].includes(String(record.device))
    ? record.device as CreatorDevice
    : 'NAO_INFORMADO';
  return {
    id: normalizeText(record.id, 120) || createStableId('creator-source'),
    platform,
    authority,
    device,
    url,
    title: normalizeText(record.title, 180) || `${card.playerName} • ficha de progressão`,
    channel: normalizeText(record.channel, 100) || 'Canal não informado',
    country: normalizeText(record.country, 80),
    publishedAt: safeDate(record.publishedAt),
    reviewedAt: safeDate(record.reviewedAt) || new Date().toISOString().slice(0, 10),
    testedInMatches: Boolean(record.testedInMatches),
    targetPosition: safePosition(record.targetPosition, card.mainPosition),
    playstyle: normalizeText(record.playstyle, 100),
    card,
    training: safeTraining(record.training),
    notes: normalizeText(record.notes, 1200)
  };
}

export function loadCreatorBuildSources(): CreatorBuildSource[] {
  try {
    const raw = readAccountStorage(CREATOR_BUILD_RESEARCH_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => sanitizeCreatorSource(item)).filter((item): item is CreatorBuildSource => Boolean(item)).slice(0, CREATOR_BUILD_RESEARCH_LIMIT);
  } catch {
    return [];
  }
}

export function saveCreatorBuildSources(sources: CreatorBuildSource[]): CreatorBuildSource[] {
  const unique = new Map<string, CreatorBuildSource>();
  for (const value of sources) {
    const source = sanitizeCreatorSource(value);
    if (!source) continue;
    const duplicateKey = `${fold(source.url)}|${fold(source.card.playerName)}|${fold(source.card.cardType)}|${fold(source.card.specialTag)}`;
    if (!unique.has(duplicateKey)) unique.set(duplicateKey, source);
  }
  const clean = [...unique.values()]
    .sort((a, b) => Date.parse(b.reviewedAt) - Date.parse(a.reviewedAt))
    .slice(0, CREATOR_BUILD_RESEARCH_LIMIT);
  writeAccountStorage(CREATOR_BUILD_RESEARCH_STORAGE_KEY, JSON.stringify(clean));
  if (typeof globalThis !== 'undefined' && typeof globalThis.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
    globalThis.dispatchEvent(new CustomEvent(CREATOR_BUILD_RESEARCH_EVENT));
  }
  return clean;
}

export function exportCreatorBuildResearch(): CreatorBuildSource[] {
  return loadCreatorBuildSources();
}

export function importCreatorBuildResearch(value: unknown): CreatorBuildSource[] {
  if (!Array.isArray(value)) return loadCreatorBuildSources();
  return saveCreatorBuildSources(value.map((item) => sanitizeCreatorSource(item)).filter((item): item is CreatorBuildSource => Boolean(item)));
}

function sameText(a: unknown, b: unknown): boolean {
  const left = fold(a);
  const right = fold(b);
  return Boolean(left && right && left === right);
}

function containsText(a: unknown, b: unknown): boolean {
  const left = fold(a);
  const right = fold(b);
  return Boolean(left && right && (left.includes(right) || right.includes(left)));
}

export function scoreCreatorSourceForResult(source: CreatorBuildSource, result: AnalysisResult): CreatorSourceMatch {
  const target = cardIdentityFromResult(result);
  let score = 0;
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (sameText(source.card.playerName, target.playerName)) { score += 40; reasons.push('nome do jogador confere'); }
  else if (containsText(source.card.playerName, target.playerName)) { score += 27; reasons.push('nome semelhante'); }
  else warnings.push('jogador diferente');

  if (sameText(source.card.cardType, target.cardType)) { score += 20; reasons.push('tipo de carta confere'); }
  else if (source.card.cardType && target.cardType) warnings.push('tipo de carta diferente ou não confirmado');

  if (sameText(source.card.specialTag, target.specialTag)) { score += target.specialTag ? 12 : 4; if (target.specialTag) reasons.push('edição especial confere'); }
  else if (source.card.specialTag && target.specialTag) warnings.push('tag/edição especial diferente');
  else if (target.specialTag && !source.card.specialTag) warnings.push('tag/edição especial não confirmada');

  if (source.card.mainPosition === target.mainPosition) { score += 8; reasons.push('posição original confere'); }
  else warnings.push('posição original diferente');

  if (source.card.maxOverall && target.maxOverall) {
    if (source.card.maxOverall === target.maxOverall) { score += 10; reasons.push('overall máximo confere'); }
    else warnings.push('overall máximo diferente');
  }

  if (source.card.trainingPointsTotal && target.trainingPointsTotal) {
    if (source.card.trainingPointsTotal === target.trainingPointsTotal) { score += 10; reasons.push('orçamento de pontos confere'); }
    else warnings.push('quantidade de pontos diferente');
  }

  const exactCard = score >= 82 && !warnings.some((warning) => warning === 'jogador diferente');
  const authorityWeight: Record<CreatorAuthority, number> = { PRO_PLAYER: 1.45, TOP_RANK: 1.30, CRIADOR: 1.0, COMUNIDADE: 0.72 };
  let weight = authorityWeight[source.authority] * Math.max(0.35, score / 100);
  if (source.testedInMatches) weight *= 1.14;
  if (source.device === 'MOBILE' || source.device === 'AMBOS') weight *= 1.08;
  return { source, score: Math.min(100, score), exactCard, reasons, warnings, weight };
}

function weightedMedian(values: Array<{ value: number; weight: number }>): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a.value - b.value);
  const total = sorted.reduce((sum, item) => sum + item.weight, 0);
  let accumulated = 0;
  for (const item of sorted) {
    accumulated += item.weight;
    if (accumulated >= total / 2) return item.value;
  }
  return sorted[sorted.length - 1]?.value ?? 0;
}

function agreementFor(values: number[], selected: number): number {
  if (!values.length) return 0;
  const close = values.filter((value) => Math.abs(value - selected) <= 1).length;
  const spread = Math.max(...values) - Math.min(...values);
  return Math.max(0, Math.min(100, Math.round((close / values.length) * 82 + Math.max(0, 18 - spread * 3))));
}

function confidenceLabel(value: number): CreatorBuildConsensus['confidenceLabel'] {
  if (value >= 88) return 'muito alta';
  if (value >= 74) return 'alta';
  if (value >= 55) return 'média';
  if (value >= 30) return 'baixa';
  return 'insuficiente';
}

export function buildCreatorBuildConsensus(result: AnalysisResult, sources = loadCreatorBuildSources()): CreatorBuildConsensus {
  const matches = sources.map((source) => scoreCreatorSourceForResult(source, result)).sort((a, b) => b.score - a.score || b.weight - a.weight);
  const hasCriticalMismatch = (match: CreatorSourceMatch) => match.warnings.some((warning) => warning === 'jogador diferente' || warning.includes('diferente'));
  const acceptedSources = matches.filter((match) => match.score >= 62 && !hasCriticalMismatch(match));
  const rejectedSources = matches.filter((match) => match.score < 62 || hasCriticalMismatch(match));
  const training = { ...EMPTY_TRAINING };
  const blocks: CreatorBlockConsensus[] = [];

  for (const key of CREATOR_TRAINING_KEYS) {
    const weighted = acceptedSources.map((match) => ({ value: match.source.training[key], weight: match.weight }));
    const values = weighted.map((item) => item.value);
    const value = weightedMedian(weighted);
    training[key] = value;
    blocks.push({
      key,
      label: CREATOR_TRAINING_LABELS[key],
      value,
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
      agreement: agreementFor(values, value),
      sampleCount: values.length
    });
  }

  const { costByBlock, totalCost } = creatorTrainingCost(training);
  const exactCardCount = acceptedSources.filter((match) => match.exactCard).length;
  const proSourceCount = acceptedSources.filter((match) => match.source.authority === 'PRO_PLAYER' || match.source.authority === 'TOP_RANK').length;
  const averageMatch = acceptedSources.length ? acceptedSources.reduce((sum, match) => sum + match.score, 0) / acceptedSources.length : 0;
  const averageAgreement = blocks.length ? blocks.reduce((sum, block) => sum + block.agreement, 0) / blocks.length : 0;
  const sampleScore = Math.min(100, acceptedSources.length * 18);
  const confidence = acceptedSources.length
    ? Math.round((averageMatch * 0.36) + (averageAgreement * 0.34) + (sampleScore * 0.20) + (Math.min(100, exactCardCount * 35) * 0.10))
    : 0;
  const warnings: string[] = [];
  if (acceptedSources.length < 3) warnings.push('Cadastre pelo menos três vídeos da carta exata para um consenso confiável.');
  if (!exactCardCount && acceptedSources.length) warnings.push('Nenhuma fonte foi confirmada como a mesma versão exata da carta.');
  if (result.trainingPointsTotal > 0 && totalCost > result.trainingPointsTotal) warnings.push(`O consenso custa ${totalCost} pontos, acima dos ${result.trainingPointsTotal} disponíveis nesta carta.`);
  if (blocks.some((block) => block.sampleCount > 1 && block.agreement < 55)) warnings.push('Há discordância relevante entre criadores em um ou mais blocos.');

  const label = confidenceLabel(confidence);
  const verdict = !acceptedSources.length
    ? 'Ainda não há fontes compatíveis cadastradas para esta carta.'
    : `Consenso calculado com ${acceptedSources.length} fonte(s), confiança ${label} e ${exactCardCount} correspondência(s) de carta exata.`;

  return {
    sources: matches,
    acceptedSources,
    rejectedSources,
    training,
    blocks,
    costByBlock,
    totalCost,
    sourceCount: acceptedSources.length,
    exactCardCount,
    proSourceCount,
    confidence,
    confidenceLabel: label,
    verdict,
    warnings
  };
}

export function buildCreatorSourceDraft(result: AnalysisResult): CreatorBuildSource {
  const card = cardIdentityFromResult(result);
  return {
    id: createStableId('creator-source'),
    platform: 'YOUTUBE',
    authority: 'CRIADOR',
    device: 'MOBILE',
    url: '',
    title: `${card.playerName} • ficha de progressão`,
    channel: '',
    country: '',
    publishedAt: null,
    reviewedAt: new Date().toISOString().slice(0, 10),
    testedInMatches: false,
    targetPosition: result.bestPosition.code,
    playstyle: normalizeText(result.parsed.playstyle, 100),
    card,
    training: emptyCreatorTraining(),
    notes: ''
  };
}
